import { createContext, useContext, useState, ReactNode, useMemo, useEffect, useRef } from 'react';
import { CanvasWindow, useCanvas } from './CanvasProvider';
import { useSelected } from './SelectedProvider';
import { useNodeComponent } from './NodesProvider';
import { useTypeOf } from './TypesProvider';
import { AnimatePresence, motion } from 'framer-motion';

const FORMAT_TAGS = {
    bold: ['b', 'strong'],
    italic: ['i', 'em'],
    underline: ['u'],
    strike: ['s', 'strike']
};
type FormatName = keyof typeof FORMAT_TAGS;

type SelectionContext = {
    selection: Selection;
    range: Range;
    doc: Document;
    element: HTMLElement;
} | null;
type EditorStateContext = {
    window: CanvasWindow;
    document: CanvasWindow['document'];
    selection: Selection;
}
interface TextEditorState {
    element: HTMLElement;
    formats: Set<string>;
    toggleFormat: (tag: keyof HTMLElementTagNameMap) => void;
    getContext: () => EditorStateContext;
    wrapSelection: (tagName: string) => void;
    unwrapSelection: (tagName: string) => void;
    clearFormats: () => void;
    updateFormats: () => void;
}

const TextEditorContext = createContext<TextEditorState | undefined>(undefined);

type TextEditorProviderProps = {
    children?: ReactNode;
    position?: "floating" | "fixed";
}
export const TextEditorProvider = ({ children, position = "floating" }: TextEditorProviderProps) => {

    const canvas = useCanvas();
    const [formats, setAppliedFormats] = useState<Set<string>>(new Set());
    const selected = useSelected();
    const id = useMemo(() => selected?.[0]?.id, [selected]);
    const node = useNodeComponent(id);
    const isText = useTypeOf(selected, 'text');

    // state
    const [isDragging, setIsDragging] = useState(false);
    const [editing, setEditing] = useState(false);
    const elRef = useRef<HTMLDivElement>(null);
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);

    const isOnEditing = Boolean(isText && editing && canvas.window && canvas.document);

    const getSelectionContext = (): SelectionContext => {
        if (!canvas.window || !node?.$el?.[0]) return null;

        const selection = canvas.window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;

        const range = selection.getRangeAt(0);
        return { selection, range, doc: canvas.window.document, element: node.$el[0] };
    };

    const setSelectionAfter = (node: Node, selection: Selection, doc: Document) => {
        const context = getSelectionContext();
        context?.element?.focus();
        const range = doc.createRange();
        range.setStartAfter(node);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    }

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
    }

    const wrapCurrentWord = (tagName: string, { selection, range, doc }: { selection: Selection; range: Range; doc: Document }) => {
        const textNode = range.startContainer;
        if (textNode.nodeType !== Node.TEXT_NODE) return null;

        const text = textNode.textContent || '';
        const offset = range.startOffset;
        const wordRegex = /[\w\u00C0-\u024F\n]+/;

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

        mergeAdjacentSameTag(wrapper, tagName);

        setSelectionAfter(wrapper, selection, doc);
        return wrapper;
    }

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
    }

    const unwrapAtCaret = (tagName: string, { selection, doc }: any) => {
        const anchorNode = selection.anchorNode;
        if (!anchorNode) return;

        const wrapper = findParentWithTag(anchorNode, tagName, doc);
        if (!wrapper) return;

        // const marker = createCaretMarker(doc);
        // selection.getRangeAt(0).insertNode(marker);
        unwrapElement(wrapper);
        // restoreCaretFromMarker(marker, selection, doc);
    }

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
    }

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
    }

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
    }

    const unwrapSelection = (tagName: string) => {
        const ctx = getSelectionContext();
        if (!ctx) return;

        const { selection, range, doc, element } = ctx;

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
        element.focus();
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

        const { range, doc, element } = ctx;
        if (range.collapsed) {
            element.innerHTML = element.textContent;
            element.focus();
            return;
        }

        // Process content between markers
        const contentRange = doc.createRange();
        const fragment = contentRange.extractContents();
        const cleaned = cleanFormatting(fragment, doc);
        contentRange.insertNode(cleaned);
        element.focus();

    }

    const updateFormats = () => {
        const ctx = getSelectionContext();
        if (!ctx) return;

        const { selection, element } = ctx;
        const anchorNode = selection?.anchorNode;
        if (!anchorNode) return;

        const formats = new Set<FormatName>();
        let current: Node | null = anchorNode;

        // Traverse up DOM tree until the editing container (`element`)
        while (current && current !== element) {
            if (current.nodeType === Node.ELEMENT_NODE) {
                const tag = (current as HTMLElement).tagName.toLowerCase();
                formats.add(tag as any);
            }
            current = current.parentNode;
        }

        setAppliedFormats(formats);
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

    // Formatting handlers
    const toggleFormat = (tag: keyof HTMLElementTagNameMap) => {
        const isApplied = formats.has(tag);
        if (isApplied) {
            unwrapSelection(tag);
        } else {
            wrapSelection(tag);
        }
    };


    const startEditing = (x: number, y: number) => {

        const document = canvas.document;
        const $el = node?.$el;
        if (!$el || !document || !isText) return;

        $el.attr("contenteditable", 'true');
        $el.trigger("focus");

        setTimeout(() => {
            if (!canvas.window || !canvas.document) return;
            const selection = canvas.window.getSelection();
            selection?.removeAllRanges();
            const range = getRangeFromPoint(x, y, document);
            if (range) {
                selection?.addRange(range);
            }

            setEditing(true);

            setTimeout(() => {
                if (position == "floating") {
                    updateFloatingXY();
                }
            }, 80);
        }, 0);
    }

    const updateFloatingXY = () => {
        if (!canvas.window || !canvas.frame) return;

        const selection = canvas.window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const rects = range.getClientRects();
        if (rects.length === 0) return;

        const firstRect = rects[0];
        const iframeRect = canvas.frame.getBoundingClientRect();
        const elRect = elRef.current?.getBoundingClientRect() || { height: 0, width: 0 };

        setX(iframeRect.left + firstRect.left - elRect.width + 25);
        setY(iframeRect.top + firstRect.top - elRect.height - 35);
    }

    const eventSelectionChange = () => {
        updateFormats();
        if (position == "floating") {
            updateFloatingXY();
        }
    }

    // Effects
    useEffect(() => {
        const element = node?.$el?.[0];
        if (!element || !isText || !canvas.document) return;

        const enableEditor = (e: MouseEvent) => startEditing(e.clientX, e.clientY);

        element.addEventListener('dblclick', enableEditor);
        canvas.document.addEventListener('selectionchange', eventSelectionChange);
        canvas.document.addEventListener('mousedown', () => setIsDragging(true));
        canvas.document.addEventListener('mouseup', () => setIsDragging(false));


        return () => {
            setAppliedFormats(new Set());
            canvas.window?.getSelection()?.removeAllRanges();
            setEditing(false);
            element?.blur();
            element?.removeAttribute("contenteditable");
            element?.removeEventListener('dblclick', enableEditor);
            canvas.document?.removeEventListener('selectionchange', eventSelectionChange);
            canvas.document?.removeEventListener('mousedown', () => setIsDragging(true));
            canvas.document?.removeEventListener('mouseup', () => setIsDragging(false));
        }
    }, [node?.component?.id, isText, position]);


    useEffect(() => {
        if (!node || position != "fixed") return;
        const rect = node.getRect();
        const elRect = elRef.current?.getBoundingClientRect() || { height: 0, width: 0 };
        setX(rect.x + canvas.rect.x - elRect.width / 2);
        setY(rect.y + canvas.rect.y - elRect.height - 35);

    }, [canvas.scrollTop, canvas.rect, node?.component?.id, position]);


    return (
        <TextEditorContext.Provider
            value={{
                element: node?.$el?.[0]!,
                getContext(): EditorStateContext {
                    return {
                        window: canvas.window!,
                        document: canvas.document!,
                        selection: canvas.window?.getSelection() as Selection
                    }
                },
                wrapSelection,
                unwrapSelection,
                clearFormats,
                toggleFormat,
                formats,
                updateFormats
            }}>
            <AnimatePresence mode='sync'>
                {isOnEditing && (
                    <motion.div
                        key={selected.map(e => e.id).join(',')}
                        ref={elRef}
                        initial={{ opacity: 0, scale: 0.5, x, y }}
                        animate={{ opacity: 1, scale: 1, x, y }}
                        exit={{ opacity: 0, scale: 0.5, x, y }}
                        style={{
                            position: 'fixed',
                            borderRadius: '6px',
                            zIndex: 999,
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}>
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </TextEditorContext.Provider>
    );
};

export const useTextEditorProvider = () => {
    const context = useContext(TextEditorContext);
    if (!context) throw new Error('useTextEditorProvider must be used within a TextEditorProviderProvider');
    return context;
};