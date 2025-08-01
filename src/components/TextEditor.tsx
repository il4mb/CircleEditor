import { ClipboardEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useCanvas } from '../contexts/CanvasProvider';
import { useSelected } from '../contexts/SelectedProvider';
import { Box, IconButton, Stack } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { getColor } from '../theme/colors';
import { Bold, Brush, Italic, Underline } from 'lucide-react';
import { useTypeOf } from '../contexts/TypesProvider';
import { useNodeComponent, useNodeComponents } from '../contexts/NodesProvider';
import { nanoid } from 'nanoid';
import { useComponentsParser, useComponentsManager } from '../contexts/ComponentsProvider';
import { TextRectOverlay } from './TextRectOverlay';
import { IRect } from '../type';

const ALLOWED_TAG = [
    "a",
    "abbr",
    "b",
    "bdi",
    "bdo",
    "br",
    "cite",
    "code",
    "data",
    "dfn",
    "em",
    "i",
    "img",
    "kbd",
    "mark",
    "q",
    "ruby",
    "s",
    "samp",
    "small",
    "span",
    "strong",
    "sub",
    "sup",
    "time",
    "u",
    "var",
    "wbr"
];


export interface TextEditorProps {
    children?: ReactNode;
}
export default function TextEditor({ children }: TextEditorProps) {

    const parser = useComponentsParser((node) => {
        if (ALLOWED_TAG.includes(node.tagName.toLowerCase())) {
            return {
                type: 'text',
            }
        }
        return {
            type: 'textnode',
        }
    });
    const elRef = useRef<HTMLDivElement>(null);
    const { updateById } = useComponentsManager();
    const canvas = useCanvas();
    const selected = useSelected();
    const id = useMemo(() => selected?.[0]?.id, [selected]);
    const node = useNodeComponent(id);
    const isText = useTypeOf(selected, 'text');
    const [editing, setEditing] = useState(false);
    const shouldVisible = editing && isText && selected.length == 1;

    const [rects, setRects] = useState<IRect[]>([]);
    const [caret, setCaret] = useState({ x: 0, y: 0 });
    const x = caret.x - 115;
    const y = caret.y - 30;

    function getTextRects(el: HTMLElement): IRect[] {
        const range = document.createRange();

        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => node.nodeValue?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
        });

        const rects: IRect[] = [];

        while (walker.nextNode()) {
            const textNode = walker.currentNode;
            if (!textNode) continue;

            range.selectNodeContents(textNode);
            const nodeRects: IRect[] = Array.from(range.getClientRects()).map(e => ({ x: e.x, y: e.y, width: e.width, height: e.height }));
            rects.push(...nodeRects);
        }

        return rects;
    }

    function safeWrapSelection(tagName: string): HTMLElement | null {
        if (!canvas.window || !canvas.document) return null;

        const selection = canvas.window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;

        const range = selection.getRangeAt(0);
        if (range.collapsed) return null;

        const contents = range.extractContents();
        const wrapper = canvas.document.createElement(tagName);

        wrapper.appendChild(contents);
        range.insertNode(wrapper);
        selection.removeAllRanges();

        eventOnChange();

        return wrapper;
    }


    const handleBold = () => safeWrapSelection('b');
    const handleItalic = () => safeWrapSelection('i');
    const handleUnderline = () => safeWrapSelection('u');
    const handleBrush = () => safeWrapSelection('span');


    const eventOnChange = () => {
        const $el = node?.$el;
        if (!$el) return;
        updateTextRects();
        const content = $el.html();
        if (node.component) {
            updateById(id, { components: [{ type: "textnode", content }] });
        }
    }

    const eventOnDoubleClick = (e: MouseEvent) => {
        const $el = node?.$el;

        console.log(e);
        if (!$el) return;

        $el.attr("contenteditable", 'true');
        setEditing(true);
        updateTextRects();
        // Give the DOM a tick to set contenteditable
        setTimeout(() => {
            if (!canvas.window || !canvas.document || !$el) return;

            // Clear existing selection
            const selection = canvas.window.getSelection();
            if (!selection) return;
            selection.removeAllRanges();

            // Get caret position from mouse click
            const range = canvas.document.caretRangeFromPoint
                ? canvas.document.caretRangeFromPoint(e.clientX, e.clientY)
                : canvas.document.caretPositionFromPoint
                    ? (() => {
                        const pos = canvas.document.caretPositionFromPoint(e.clientX, e.clientY);
                        const r = canvas.document.createRange();
                        if (pos?.offsetNode) {
                            r.setStart(pos.offsetNode, pos.offset);
                            r.collapse(true);
                            return r;
                        }
                        return null;
                    })()
                    : null;

            if (range) {
                selection.addRange(range);
            }
        }, 0);
    }

    const eventOnPaste = (e: any) => {

        e.preventDefault();
        const $el = node?.$el;
        if (!$el) return;

        const event = e.originalEvent as ClipboardEvent
        const html = event.clipboardData?.getData('text/html') || event.clipboardData?.getData('text/plain');
        if (!html) return;

        node?.append(parser(html));
    }

    const updateTextRects = () => {
        const $el = node?.$el;
        if (!$el) return;
        setRects(getTextRects($el[0]));
    }



    useEffect(() => {

        const $el = node?.$el;
        if (!$el || !isText) return;

        $el.on("dblclick", eventOnDoubleClick as any);
        $el.on("input", eventOnChange as any);
        $el.on('paste', eventOnPaste as any);

        return () => {
            setEditing(false);
            $el.removeAttr("contenteditable");
            $el.trigger("blur");
            $el.off("dblclick", eventOnDoubleClick as any);
            $el.off('paste', eventOnPaste as any);
            $el.off("input", eventOnChange as any);

        }
    }, [node?.component?.id, isText]);


    useEffect(() => {
        if (!canvas.window || !canvas.frame || !canvas.document) return;

        const selectionChange = () => {
            if (!canvas.window || !canvas.frame) return;

            const selection = canvas.window.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);
            const rects = range.getClientRects();

            if (rects.length === 0) return;

            const firstRect = rects[0]; // posisi awal dari seleksi
            const iframeRect = canvas.frame.getBoundingClientRect();

            const x = iframeRect.left + firstRect.left;
            const y = iframeRect.top + firstRect.top;

            setCaret({ x, y });
        };


        selectionChange();
        updateTextRects();

        canvas.document.addEventListener('selectionchange', selectionChange);
        return () => {
            canvas.document?.removeEventListener('selectionchange', selectionChange);
        }
    }, [canvas.window, canvas.rect]);


    return (
        <>
            <AnimatePresence mode='sync'>
                {shouldVisible && (
                    <motion.div
                        key={id}
                        ref={elRef}
                        initial={{
                            top: y + 'px',
                            left: x + 'px',
                            opacity: 0,
                            scale: 0.5
                        }}
                        animate={{
                            top: y + 'px',
                            left: x + 'px',
                            opacity: 1,
                            scale: 1
                        }}
                        exit={{
                            top: y + 'px',
                            left: x + 'px',
                            opacity: 0,
                            scale: 0.5
                        }}
                        style={{
                            position: 'fixed',
                            background: getColor('primary')[400],
                            width: '104px',
                            height: '25px',
                            borderRadius: '4px',
                            zIndex: 999
                        }}>

                        <Stack direction={"row"} spacing={0.2} alignItems={"center"}>
                            <IconButton size='small' onClick={handleBold}>
                                <Bold size={12} />
                            </IconButton>
                            <IconButton size='small' onClick={handleItalic}>
                                <Italic size={12} />
                            </IconButton>
                            <IconButton size='small' onClick={handleUnderline}>
                                <Underline size={12} />
                            </IconButton>
                            <IconButton size='small' onClick={handleBrush}>
                                <Brush size={12} />
                            </IconButton>
                        </Stack>

                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}