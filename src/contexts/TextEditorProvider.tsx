import { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { useCanvas } from './CanvasProvider';
import { useSelected } from './SelectedProvider';
import { useNodeComponent } from './NodesProvider';
import { useTypeOf } from './TypesProvider';

const FORMAT_TAGS = {
    bold: ['b', 'strong'],
    italic: ['i', 'em'],
    underline: ['u'],
    strike: ['s', 'strike']
};
type FormatName = keyof typeof FORMAT_TAGS;

interface TextEditorState {
    wrapSelection: (tagName: FormatName) => void;
    unwrapSelection: (tagName: FormatName) => void;
    clearFormats: () => void;
    formats: Set<FormatName>;
    updateFormats: () => void;
}

const TextEditorContext = createContext<TextEditorState | undefined>(undefined);

type TextEditorProviderProps = {
    children?: ReactNode;
}
export const TextEditorProvider = ({ children }: TextEditorProviderProps) => {

    const canvas = useCanvas();
    const [formats, setAppliedFormats] = useState<Set<FormatName>>(new Set());

    const selected = useSelected();
    const id = useMemo(() => selected?.[0]?.id, [selected]);
    const node = useNodeComponent(id);
    const isText = useTypeOf(selected, 'text');

    // State
    const [editing, setEditing] = useState(false);



    const getSelectionContext = () => {
        if (!canvas.window) return null;

        const selection = canvas.window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;

        const range = selection.getRangeAt(0);
        return { selection, range, doc: canvas.window.document };
    };

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

    const wrapCurrentWord = (tagName: string, { selection, range, doc }: any) => {
        const textNode = range.startContainer;
        if (textNode.nodeType !== Node.TEXT_NODE) return null;

        const text = textNode.textContent || '';
        const offset = range.startOffset;
        const wordRegex = /[\w\u00C0-\u024F]+/;

        let start = offset;
        while (start > 0 && wordRegex.test(text[start - 1])) start--;

        let end = offset;
        while (end < text.length && wordRegex.test(text[end])) end++;

        if (start >= end) return null;

        const wordRange = doc.createRange();
        wordRange.setStart(textNode, start);
        wordRange.setEnd(textNode, end);

        const wrapper = doc.createElement(tagName);
        wrapper.appendChild(wordRange.extractContents());
        wordRange.insertNode(wrapper);

        setSelectionAfter(wrapper, selection, doc);
        return wrapper;
    };

    const mergeAdjacentSameTag = (element: HTMLElement, tagName: string) => {
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
                prevEl.remove();
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
                nextEl.remove();
            } else break;
        }

        // Clean up nested tags
        const nested = element.querySelectorAll(tagName);
        nested.forEach(n => unwrapElement(n as HTMLElement));

        if (isEmptyOrWhitespace(element)) {
            element.remove();
        }
    };

    const unwrapAtCaret = (tagName: string, { selection, doc }: any) => {
        const anchorNode = selection.anchorNode;
        if (!anchorNode) return;

        const wrapper = findParentWithTag(anchorNode, tagName, doc);
        if (!wrapper) return;

        const marker = createCaretMarker(doc);
        selection.getRangeAt(0).insertNode(marker);
        unwrapElement(wrapper);
        restoreCaretFromMarker(marker, selection, doc);
    };

    const unwrapElement = (element: Element) => {
        const parent = element.parentNode;
        if (!parent) return;

        const fragment = document.createDocumentFragment();
        while (element.firstChild) {
            fragment.appendChild(element.firstChild);
        }

        parent.insertBefore(fragment, element);
        parent.removeChild(element);
        cleanEmptyParents(parent);
    };

    const cleanEmptyParents = (node: Node) => {
        let current: Node | null = node;
        while (current && current !== document.body) {
            if (current.nodeType === Node.ELEMENT_NODE &&
                (current as Element).childNodes.length === 0 &&
                (current as Element).tagName.toLowerCase() !== 'br') {
                const next = current.parentNode as any;
                current.parentNode?.removeChild(current);
                current = next;
            } else {
                break;
            }
        }
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



    const unwrapSelection = (tagName: string) => {
        const ctx = getSelectionContext();
        if (!ctx) return;

        const { selection, range, doc } = ctx;

        if (range.collapsed) {
            return unwrapAtCaret(tagName, { selection, doc });
        }

        const tagsToMatch = FORMAT_TAGS[tagName as keyof typeof FORMAT_TAGS] || [tagName];
        const fragment = range.extractContents();

        tagsToMatch.forEach(tag => {
            const elements = fragment.querySelectorAll(tag);
            elements.forEach((element: any) => {
                unwrapElement(element);
            });
        });

        range.insertNode(fragment);

        const newRange = doc.createRange();
        newRange.selectNodeContents(range.extractContents());
        range.insertNode(newRange.extractContents());
        selection.removeAllRanges();
        selection.addRange(newRange);
    }

    const wrapSelection = (tagName: string) => {
        const ctx = getSelectionContext();
        if (!ctx) return;

        const { selection, range, doc } = ctx;

        if (range.collapsed) {
            return wrapCurrentWord(tagName, ctx);
        }

        let wrapper = findParentWithTag(range.commonAncestorContainer, tagName, doc);
        const contents = range.extractContents();

        if (wrapper) {
            wrapper.appendChild(contents);
            setSelectionAfter(wrapper, selection, doc);
        } else {
            wrapper = doc.createElement(tagName);
            wrapper.appendChild(contents);
            range.insertNode(wrapper);
            setSelectionAfter(wrapper, selection, doc);
        }

        mergeAdjacentSameTag(wrapper, tagName);
    }

    const clearFormats = () => {
        const ctx = getSelectionContext();
        if (!ctx) return;

        const { range, doc } = ctx;
        if (range.collapsed) {

            return;
        }

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
    }

    const updateFormats = () => {

        const ctx = getSelectionContext();
        if (!ctx) return;

        const { selection, doc } = ctx;
        const anchorNode = selection?.anchorNode;
        if (!anchorNode) return;

        const formats = new Set<FormatName>();
        let current: Node | null = anchorNode;

        if (current.nodeType === Node.ELEMENT_NODE) {
            const element = current as HTMLElement;
            const tag = element.tagName.toLowerCase();

            // Check tag-based formatting
            for (const [format, tags] of Object.entries(FORMAT_TAGS)) {
                if (tags.includes(tag)) {
                    formats.add(format as FormatName);
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

        setAppliedFormats(formats);
    }

    // Effects
    useEffect(() => {
        const $el = node?.$el;
        if (!$el || !isText) return;

        const enableEditor = () => setEditing(true);
        $el.on("dblclick", enableEditor);

        return () => {

            setAppliedFormats(new Set());
            setEditing(false);

            $el.removeAttr("contenteditable");
            $el.trigger("blur");
            $el.off("dblclick", enableEditor);
        };
    }, [node?.component?.id, isText]);


    return (
        <TextEditorContext.Provider
            value={{
                wrapSelection,
                unwrapSelection,
                clearFormats,
                formats,
                updateFormats
            }}>
            {children}
        </TextEditorContext.Provider>
    );
};

export const useTextEditorProvider = () => {
    const context = useContext(TextEditorContext);
    if (!context) throw new Error('useTextEditorProvider must be used within a TextEditorProviderProvider');
    return context;
};