import { ClipboardEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useCanvas } from '../contexts/CanvasProvider';
import { useSelected } from '../contexts/SelectedProvider';
import { alpha, Box, IconButton, Stack, Tooltip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { getColor } from '../theme/colors';
import { Bold, Brush, Italic, RemoveFormatting, Strikethrough, Underline } from 'lucide-react';
import { useTypeOf } from '../contexts/TypesProvider';
import { useNodeComponent } from '../contexts/NodesProvider';
import { useComponentsParser, useComponentsManager } from '../contexts/ComponentsProvider';
import { debounce } from 'lodash';

// Constants
const ALLOWED_TAGS = new Set([
    "a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "data", "dfn",
    "em", "i", "img", "kbd", "mark", "q", "ruby", "s", "samp", "small",
    "span", "strong", "sub", "sup", "time", "u", "var", "wbr"
]);

const FORMAT_TAGS = {
    bold: ['b', 'strong'],
    italic: ['i', 'em'],
    underline: ['u'],
    strike: ['s', 'strike']
};

const FORMAT_ACTIONS = {
    bold: { tag: 'b', icon: <Bold size={14} /> },
    italic: { tag: 'i', icon: <Italic size={14} /> },
    underline: { tag: 'u', icon: <Underline size={14} /> },
    strike: { tag: 's', icon: <Strikethrough size={14} /> }
};

interface TextEditorProps {
    children?: ReactNode;
}

export default function TextEditor({ children }: TextEditorProps) {
    // Context hooks
    const parser = useComponentsParser((node) => ({
        type: ALLOWED_TAGS.has(node.tagName.toLowerCase()) ? 'text' : 'textnode'
    }));
    const { updateById } = useComponentsManager();
    const canvas = useCanvas();
    const selected = useSelected();
    const id = useMemo(() => selected?.[0]?.id, [selected]);
    const node = useNodeComponent(id);
    const isText = useTypeOf(selected, 'text');

    // State
    const [editing, setEditing] = useState(false);
    const [caret, setCaret] = useState({ x: 0, y: 0 });
    const [appliedFormats, setAppliedFormats] = useState<Set<string>>(new Set());
    const [isDragging, setIsDragging] = useState(false);

    // Refs
    const elRef = useRef<HTMLDivElement>(null);
    const debouncedChange = debounce(() => {
        const content = node?.$el?.html();
        if (content && node?.component) {
            updateById(id, { components: [{ type: "textnode", content }] });
        }
    }, 300);

    // Derived values
    const shouldVisible = editing && isText && selected.length === 1;
    const x = caret.x - 165;
    const y = caret.y - 85;

    // Utility functions
    const normalizeRangeBoundaries = (range: Range) => {
        const { startContainer, startOffset, endContainer, endOffset } = range;

        if (startContainer.nodeType === Node.TEXT_NODE && startOffset > 0) {
            (startContainer as Text).splitText(startOffset);
            range.setStart(startContainer, startOffset);
        }

        if (endContainer.nodeType === Node.TEXT_NODE &&
            endOffset < (endContainer.nodeValue?.length || 0)) {
            (endContainer as Text).splitText(endOffset);
            range.setEnd(endContainer, endOffset);
        }
    };

    const getSelectionContext = () => {
        if (!canvas.window || !canvas.document) return null;

        const selection = canvas.window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;

        const range = selection.getRangeAt(0);
        return { selection, range, doc: canvas.document, win: canvas.window };
    };

    const wrapSelection = (tagName: string) => {
        const ctx = getSelectionContext();
        if (!ctx) return;

        const { selection, range, doc } = ctx;

        if (range.collapsed) {
            return wrapCurrentWord(tagName, ctx);
        }

        // Check for existing wrapper
        let wrapper = findParentWithTag(range.commonAncestorContainer, tagName, doc);

        // Extract and normalize content
        const contents = range.extractContents();
        removeEmptyNodes(contents);

        if (wrapper) {
            // Merge into existing wrapper
            wrapper.appendChild(contents);
            setSelectionAfter(wrapper, selection, doc);
        } else {
            // Create new wrapper
            wrapper = doc.createElement(tagName);
            wrapper.appendChild(contents);
            range.insertNode(wrapper);
            setSelectionAfter(wrapper, selection, doc);
        }

        mergeAdjacentSameTag(wrapper, tagName);

        updateFormats();
        debouncedChange();
    };

    function mergeAdjacentSameTag(element: HTMLElement, tagName: string) {
        tagName = tagName.toUpperCase();

        const isEmptyOrWhitespace = (el: HTMLElement) => {
            return !el.textContent || el.textContent.trim() === '';
        };

        const unwrapElement = (el: HTMLElement) => {
            const parent = el.parentNode!;
            while (el.firstChild) {
                parent.insertBefore(el.firstChild, el);
            }
            el.remove();
        };

        // Merge with previous siblings
        let prev = element.previousSibling;
        while (prev && prev.nodeType === Node.ELEMENT_NODE) {
            const prevEl = prev as HTMLElement;
            if (prevEl.tagName === tagName) {
                element.innerHTML = prevEl.innerHTML + element.innerHTML;
                prevEl.remove();
                prev = element.previousSibling;
            } else if (isEmptyOrWhitespace(prevEl)) {
                prev = prev.previousSibling;
                prevEl.remove(); // remove empty tag
            } else break;
        }

        // Merge with next siblings
        let next = element.nextSibling;
        while (next && next.nodeType === Node.ELEMENT_NODE) {
            const nextEl = next as HTMLElement;
            if (nextEl.tagName === tagName) {
                element.innerHTML += nextEl.innerHTML;
                nextEl.remove();
                next = element.nextSibling;
            } else if (isEmptyOrWhitespace(nextEl)) {
                next = next.nextSibling;
                nextEl.remove(); // remove empty tag
            } else break;
        }

        // Clean up children with the same tag (flatten nested)
        const nested = element.querySelectorAll(tagName);
        nested.forEach(n => unwrapElement(n as any));

        // Final check: remove this element if empty (after merge/unwrap)
        if (isEmptyOrWhitespace(element)) {
            element.remove();
        }
    }


    const wrapCurrentWord = (tagName: string, { selection, range, doc }: any) => {
        const textNode = range.startContainer;
        if (textNode.nodeType !== Node.TEXT_NODE) return null;

        const text = textNode.textContent || '';
        const offset = range.startOffset;
        const wordRegex = /[\w\u00C0-\u024F]+/; // Supports accented characters

        // Find word boundaries
        let start = offset;
        while (start > 0 && wordRegex.test(text[start - 1])) start--;

        let end = offset;
        while (end < text.length && wordRegex.test(text[end])) end++;

        if (start >= end) return null;

        // Create range for the word
        const wordRange = doc.createRange();
        wordRange.setStart(textNode, start);
        wordRange.setEnd(textNode, end);

        // Wrap the word
        const wrapper = doc.createElement(tagName);
        wrapper.appendChild(wordRange.extractContents());
        wordRange.insertNode(wrapper);

        // Set selection after wrapper
        setSelectionAfter(wrapper, selection, doc);
        return wrapper;
    };

    const unwrapAtCaret = (tagName: string, { selection, doc }: any) => {
        const anchorNode = selection.anchorNode;
        if (!anchorNode) return;

        const wrapper = findParentWithTag(anchorNode, tagName, doc);
        if (!wrapper) return;

        // Insert caret marker
        const marker = createCaretMarker(doc);
        selection.getRangeAt(0).insertNode(marker);

        // Unwrap
        unwrapElement(wrapper);

        // Restore caret
        restoreCaretFromMarker(marker, selection, doc);
    };


    const unwrapSelection = (tagName: string) => {
        const ctx = getSelectionContext();
        if (!ctx) return;

        const { selection, range, doc } = ctx;

        if (range.collapsed) {
            return unwrapAtCaret(tagName, { selection, range, doc });
        }

        // Get all tags that represent this format (b/strong for bold)
        const tagsToMatch = FORMAT_TAGS[tagName as keyof typeof FORMAT_TAGS] || [tagName];

        // Handle case where selection is entirely within a matching element
        const commonAncestor = range.commonAncestorContainer;
        let parentElement: HTMLElement | null = null;

        // Check if we're directly inside a matching element
        if (commonAncestor.nodeType === Node.ELEMENT_NODE &&
            tagsToMatch.includes((commonAncestor as Element).tagName.toLowerCase())) {
            parentElement = commonAncestor as HTMLElement;
        }
        // Or if a parent is a matching element
        else {
            let current: Node | null = commonAncestor;
            while (current && current !== doc.body) {
                if (current.nodeType === Node.ELEMENT_NODE &&
                    tagsToMatch.includes((current as Element).tagName.toLowerCase())) {
                    parentElement = current as HTMLElement;
                    break;
                }
                current = current.parentNode;
            }
        }

        // If we found a matching parent element
        if (parentElement) {
            unwrapPartialSelection(tagName);
        } else {

            // Original logic for non-element cases
            const fragment = range.extractContents();

            tagsToMatch.forEach(tag => {
                const elements = fragment.querySelectorAll(tag);
                elements.forEach((element: any) => {
                    unwrapSingleElement(element);
                });
            });

            range.insertNode(fragment);
        }

        // Restore selection
        const newRange = doc.createRange();
        newRange.selectNodeContents(range.extractContents());
        range.insertNode(newRange.extractContents());
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        updateFormats();
        debouncedChange();
    };


    const unwrapPartialSelection = (tagName: string) => {
        const ctx = getSelectionContext();
        if (!ctx) return;
        const { selection, range, doc } = ctx;
        if (range.collapsed) return;

        const tag = tagName.toLowerCase();
        const formatTags = FORMAT_TAGS[tagName as keyof typeof FORMAT_TAGS] || [tag];

        // Step 1: Get common ancestor
        const ancestor = range.commonAncestorContainer;
        let formattingParent: HTMLElement | null = null;

        let current: Node | null = ancestor;
        while (current && current !== doc.body) {
            if (current.nodeType === Node.ELEMENT_NODE &&
                formatTags.includes((current as Element).tagName.toLowerCase())) {
                formattingParent = current as HTMLElement;
                break;
            }
            current = current.parentNode;
        }

        if (!formattingParent) return;

        // Step 2: Split the formatting element at selection start and end
        const splitRange = doc.createRange();
        splitRange.selectNode(formattingParent);
        const clone = formattingParent.cloneNode(true) as HTMLElement;

        const allText = formattingParent.textContent!;
        const startOffset = getTextOffsetWithin(formattingParent, range.startContainer, range.startOffset);
        const endOffset = getTextOffsetWithin(formattingParent, range.endContainer, range.endOffset);

        // Text parts
        const left = allText.slice(0, startOffset);
        const middle = allText.slice(startOffset, endOffset);
        const right = allText.slice(endOffset);

        // Step 3: Create 3 parts
        const leftNode = left ? wrapInTag(left, tag) : null;
        const middleNode = doc.createTextNode(middle); // <-- unwrapped
        const rightNode = right ? wrapInTag(right, tag) : null;

        // Step 4: Replace original element with split parts
        const parent = formattingParent.parentNode!;
        const frag = doc.createDocumentFragment();
        if (leftNode) frag.appendChild(leftNode);
        frag.appendChild(middleNode);
        if (rightNode) frag.appendChild(rightNode);

        parent.replaceChild(frag, formattingParent);

        // Step 5: Restore selection on unwrapped node
        const newRange = doc.createRange();
        newRange.setStart(middleNode, 0);
        newRange.setEnd(middleNode, middle.length);
        selection.removeAllRanges();
        selection.addRange(newRange);

        updateFormats();
        debouncedChange();
    };

    // Helper to get flat offset into a node tree
    function getTextOffsetWithin(root: Node, container: Node, offset: number): number {
        let count = 0;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (node === container) return count + offset;
            count += node.textContent!.length;
        }
        return count;
    }

    function wrapInTag(text: string, tag: string): HTMLElement {
        const el = document.createElement(tag);
        el.textContent = text;
        return el;
    }

    // Helper to unwrap a single element while preserving its children
    const unwrapSingleElement = (element: HTMLElement) => {
        const parent = element.parentNode;
        if (!parent) return;

        // Create marker to track position
        const marker = document.createComment('unwrap-marker');
        parent.insertBefore(marker, element);

        // Move all children out
        while (element.firstChild) {
            parent.insertBefore(element.firstChild, marker);
        }

        // Remove empty element and marker
        parent.removeChild(element);
        parent.removeChild(marker);

    };

    const findParentWithTag = (node: Node, tagName: string, doc: Document) => {
        let current: Node | null = node;
        const tags = FORMAT_TAGS[tagName as keyof typeof FORMAT_TAGS] || [tagName];

        while (current && current !== doc.body) {
            if (current.nodeType === Node.ELEMENT_NODE) {
                const tag = (current as Element).tagName.toLowerCase();
                if (tags.includes(tag)) return current as HTMLElement;
            }
            current = current.parentNode;
        }
        return null;
    };

    // Improved version that handles partial selections better
    const unwrapElement = (element: Element) => {
        const parent = element.parentNode;
        if (!parent) return;

        // Create a document fragment to hold children temporarily
        const fragment = document.createDocumentFragment();

        // Move all children to fragment
        while (element.firstChild) {
            fragment.appendChild(element.firstChild);
        }

        // Insert fragment where the element was
        parent.insertBefore(fragment, element);

        // Remove the empty element
        parent.removeChild(element);
    };

    // Helper function to clean up empty parent nodes
    const cleanEmptyParents = (node: Node) => {
        let current: Node | null = node;

        while (current && current !== document.body) {
            if (current.nodeType === Node.ELEMENT_NODE &&
                (current as Element).childNodes.length === 0 &&
                (current as Element).tagName.toLowerCase() !== 'br') { // Preserve <br> tags
                const next = current.parentNode as any;
                current.parentNode?.removeChild(current);
                current = next;
            } else {
                break;
            }
        }
    };

    const createCaretMarker = (doc: Document) => {
        const marker = doc.createElement('span');
        marker.id = '__caret_marker__';
        marker.style.cssText = 'display:inline-block;width:0;height:0;overflow:hidden;';
        return marker;
    };

    const restoreCaretFromMarker = (marker: HTMLElement, selection: Selection, doc: Document) => {
        if (!marker.parentNode) return;

        const index = Array.from(marker.parentNode.childNodes).indexOf(marker);
        const range = doc.createRange();
        range.setStart(marker.parentNode, index);
        range.collapse(true);

        selection.removeAllRanges();
        selection.addRange(range);
        marker.remove();
    };

    const setSelectionAfter = (node: Node, selection: Selection, doc: Document) => {
        const range = doc.createRange();
        range.setStartAfter(node);
        range.collapse(true);

        selection.removeAllRanges();
        selection.addRange(range);
    };

    const removeEmptyNodes = (root: Node) => {
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_ELEMENT,
            {
                acceptNode: (node) =>
                    node.childNodes.length === 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
            }
        );

        let emptyNode;
        while (emptyNode = walker.nextNode()) {
            emptyNode.parentNode?.removeChild(emptyNode);
        }
    };

    // Formatting handlers
    const toggleFormat = (format: string) => {
        const isApplied = appliedFormats.has(format);
        const action = FORMAT_ACTIONS[format as keyof typeof FORMAT_ACTIONS];
        const context = getSelectionContext();
        // Save the current selection details

        if (isApplied) {
            unwrapSelection(action.tag);
        } else {
            wrapSelection(action.tag);
        }
        node?.$el?.trigger("focus");
    };

    const handleRemoveFormatting = () => {
        const ctx = getSelectionContext();
        if (!ctx) return;

        const { range, doc } = ctx;
        if (range.collapsed) return;

        // Create markers
        const startMarker = createCaretMarker(doc);
        const endMarker = createCaretMarker(doc);
        range.insertNode(endMarker);
        range.cloneRange().insertNode(startMarker);

        // Process content between markers
        const contentRange = doc.createRange();
        contentRange.setStartAfter(startMarker);
        contentRange.setEndBefore(endMarker);

        const fragment = contentRange.extractContents();
        const cleaned = cleanFormatting(fragment, doc);
        contentRange.insertNode(cleaned);

        // Restore selection
        // restoreSelectionBetweenMarkers(startMarker, endMarker, selection, doc);

        updateFormats();
        debouncedChange();
    };

    const cleanFormatting = (fragment: DocumentFragment, doc: Document) => {
        const cleaned = doc.createDocumentFragment();
        const walker = doc.createTreeWalker(
            fragment,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
        );

        let node;
        while (node = walker.nextNode()) {
            if (node.nodeType === Node.TEXT_NODE) {
                cleaned.appendChild(node.cloneNode());
            } else if ((node as Element).tagName.toLowerCase() === 'br') {
                cleaned.appendChild(node.cloneNode());
            } else {
                // For elements, just process their children
                const childWalker = doc.createTreeWalker(
                    node,
                    NodeFilter.SHOW_TEXT
                );

                let child;
                while (child = childWalker.nextNode()) {
                    cleaned.appendChild(child.cloneNode());
                }
            }
        }

        return cleaned;
    };

    function removeEmptyTextNodes(parent: Node) {
        const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT);
        const toRemove: Text[] = [];

        while (walker.nextNode()) {
            const node = walker.currentNode as Text;
            if (!node.nodeValue || node.nodeValue.trim() === '') {
                toRemove.push(node);
            }
        }

        toRemove.forEach(n => n.remove());
    }




    const eventOnDoubleClick = (e: MouseEvent) => {
        const $el = node?.$el;
        if (!$el) return;

        $el.attr("contenteditable", 'true');
        setEditing(true);

        // Focus and set caret position
        setTimeout(() => {
            if (!canvas.window || !canvas.document) return;

            const selection = canvas.window.getSelection();
            selection?.removeAllRanges();

            const range = getRangeFromPoint(e.clientX, e.clientY, canvas.document);
            if (range) {
                selection?.addRange(range);
            }
        }, 0);
    };

    const getRangeFromPoint = (x: number, y: number, doc: Document) => {
        if (doc.caretRangeFromPoint) {
            return doc.caretRangeFromPoint(x, y);
        }

        if (doc.caretPositionFromPoint) {
            const pos = doc.caretPositionFromPoint(x, y);
            if (pos?.offsetNode) {
                const range = doc.createRange();
                range.setStart(pos.offsetNode, pos.offset);
                range.collapse(true);
                return range;
            }
        }

        return null;
    };

    const eventOnPaste = (e: any) => {
        e.preventDefault();
        const $el = node?.$el;
        if (!$el) return;

        const event = e.originalEvent as ClipboardEvent;
        const text = event.clipboardData?.getData('text/plain') || '';

        // Sanitize pasted content
        const sanitized = document.createElement('div');
        sanitized.textContent = text;

        $el.append(sanitized.innerHTML);
        debouncedChange();
    };

    const updateFormats = () => {
        const ctx = getSelectionContext();
        if (!ctx) return;

        const { selection, doc } = ctx;
        const anchorNode = selection?.anchorNode;
        if (!anchorNode) return;

        const formats = new Set<string>();
        let current: Node | null = anchorNode;
        const el = node?.$el?.[0];

        while (current && current !== el) {
            if (current.nodeType === Node.ELEMENT_NODE) {
                const element = current as HTMLElement;
                const tag = element.tagName.toLowerCase();

                // Check tag-based formatting
                for (const [format, tags] of Object.entries(FORMAT_TAGS)) {
                    if (tags.includes(tag)) {
                        formats.add(format);
                    }
                }

                // Check style-based formatting
                const style = getComputedStyle(element);
                if (style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 600) {
                    formats.add('bold');
                }
                if (style.fontStyle === 'italic') {
                    formats.add('italic');
                }
                if (style.textDecoration.includes('underline')) {
                    formats.add('underline');
                }
                if (style.textDecoration.includes('line-through')) {
                    formats.add('strike');
                }
            }

            current = current.parentNode;
        }

        setAppliedFormats(formats);
    };

    const updateCaretPosition = () => {
        if (!canvas.window || !canvas.frame) return;

        const selection = canvas.window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const rects = range.getClientRects();
        if (rects.length === 0) return;

        const firstRect = rects[0];
        const iframeRect = canvas.frame.getBoundingClientRect();

        setCaret({
            x: iframeRect.left + firstRect.left,
            y: iframeRect.top + firstRect.top
        });
    };

    const handleSelectionChange = () => {
        if (isDragging) return;
        updateCaretPosition();
        updateFormats();
    };

    // Effects
    useEffect(() => {
        const $el = node?.$el;
        if (!$el || !isText) return;

        $el.on("dblclick", eventOnDoubleClick as any);
        $el.on("input", debouncedChange);
        $el.on('paste', eventOnPaste as any);

        const doc = canvas.document;
        doc?.addEventListener('selectionchange', handleSelectionChange);
        doc?.addEventListener('mousedown', () => setIsDragging(true));
        doc?.addEventListener('mouseup', () => setIsDragging(false));

        return () => {
            debouncedChange.cancel();
            setAppliedFormats(new Set());
            setEditing(false);

            $el.removeAttr("contenteditable");
            $el.trigger("blur");
            $el.off("dblclick", eventOnDoubleClick as any);
            $el.off('paste', eventOnPaste as any);
            $el.off("input", debouncedChange);

            doc?.removeEventListener('selectionchange', handleSelectionChange);
            doc?.removeEventListener('mousedown', () => setIsDragging(true));
            doc?.removeEventListener('mouseup', () => setIsDragging(false));
        };
    }, [node?.component?.id, isText]);

    useEffect(() => {
        if (!canvas.window || !canvas.frame || !canvas.document) return;
        updateCaretPosition();
        updateFormats();
    }, [canvas.window, canvas.frame, canvas.document]);

    // Render
    return (
        <AnimatePresence mode='sync'>
            {shouldVisible && (
                <motion.div
                    key={selected.map(e => e.id).join(',')}
                    ref={elRef}
                    initial={{ opacity: 0, scale: 0.5, x, y }}
                    animate={{ opacity: 1, scale: 1, x, y }}
                    exit={{ opacity: 0, scale: 0.5, x, y }}
                    style={{
                        position: 'fixed',
                        background: getColor('primary')[300],
                        height: '30px',
                        borderRadius: '6px',
                        zIndex: 999,
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                >
                    <Stack direction="row" spacing={0} alignItems="center">
                        {Object.entries(FORMAT_ACTIONS).map(([format, { icon }]) => (
                            <Tooltip key={format} title={format.charAt(0).toUpperCase() + format.slice(1)}>
                                <IconButton
                                    sx={{
                                        opacity: appliedFormats.has(format) ? 1 : 0.7,
                                        background: appliedFormats.has(format)
                                            ? alpha(getColor('primary')[800], 0.2)
                                            : 'transparent',
                                        borderRadius: 0,
                                        width: 32,
                                        height: 30,
                                        '&:hover': {
                                            background: alpha(getColor('primary')[800], 0.1)
                                        }
                                    }}
                                    size="small"
                                    onClick={() => toggleFormat(format)}
                                >
                                    {icon}
                                </IconButton>
                            </Tooltip>
                        ))}

                        <Tooltip title="Remove formatting">
                            <IconButton
                                sx={{
                                    borderRadius: 0,
                                    width: 32,
                                    height: 30,
                                    '&:hover': {
                                        background: alpha(getColor('primary')[800], 0.1)
                                    }
                                }}
                                size="small"
                                onClick={handleRemoveFormatting}
                            >
                                <RemoveFormatting size={14} />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </motion.div>
            )}
        </AnimatePresence>
    );
}