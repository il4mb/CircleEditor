import { ReactNode, useEffect, useRef, useState } from 'react';
import { useCanvas } from '../contexts/CanvasProvider';
import { useSelected } from '../contexts/SelectedProvider';
import { IconButton, Stack } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { getColor } from '../theme/colors';
import { Bold, Brush, Italic, Underline } from 'lucide-react';
import { useTypeOf } from '../contexts/TypesProvider';
import { useNodeComponents } from '../contexts/NodesProvider';
import { nanoid } from 'nanoid';
import { useUpdateComponents } from '../contexts/ComponentsProvider';

export interface TextEditorProps {
    children?: ReactNode;
}
export default function TextEditor({ children }: TextEditorProps) {

    const elRef = useRef<HTMLDivElement>(null);
    const { updateById } = useUpdateComponents();
    const canvas = useCanvas();
    const selected = useSelected();
    const nodes = useNodeComponents(selected);
    const isText = useTypeOf(selected, 'text');
    const [editing, setEditing] = useState(false);
    const shouldVisible = editing && isText && selected.length == 1;


    const [caret, setCaret] = useState({ x: 0, y: 0 });
    const x = caret.x - 115;
    const y = caret.y - 30;

    function getSelectedTextSegments(el: HTMLElement) {
        const selection = canvas.window?.getSelection();
        if (!selection || selection.rangeCount === 0) return null;

        const fullText = el.innerText;
        const segments: { selected: string; index: number }[] = [];
        let offset = 0;

        for (let i = 0; i < selection.rangeCount; i++) {
            const range = selection.getRangeAt(i);
            if (!el.contains(range.startContainer)) continue;

            const preRange = document.createRange();
            preRange.setStart(el, 0);
            preRange.setEnd(range.startContainer, range.startOffset);

            const beforeLength = preRange.toString().length;
            const selected = range.toString();
            segments.push({
                selected,
                index: beforeLength,
            });

            offset += selected.length;
        }

        return {
            fullText,
            selections: segments,
        };
    }

    const handleBold = () => {

        const component = selected[0];
        const node = nodes[0];

        if (!component || !node || !isText || !canvas.window) return;

        const selectionData = getSelectedTextSegments(node[0]);
        if (!selectionData) return;

        const { fullText, selections } = selectionData;

        let components: any[] = [];
        let lastIndex = 0;

        for (let i = 0; i < selections.length; i++) {
            const { selected, index } = selections[i];

            if (index > lastIndex) {
                components.push({
                    id: nanoid(),
                    type: 'text',
                    tagName: 'span',
                    content: fullText.slice(lastIndex, index),
                });
            }

            components.push({
                id: nanoid(),
                type: 'text',
                tagName: 'b',
                content: selected,
            });

            lastIndex = index + selected.length;
        }

        if (lastIndex < fullText.length) {
            components.push({
                id: nanoid(),
                type: 'text',
                tagName: 'span',
                content: fullText.slice(lastIndex),
            });

        }

        updateById(component.id, { components, content: undefined });
    }


    const handleItalic = () => {
        const component = selected[0];
        const node = nodes[0];

        if (!component || !node || !isText || !canvas.window) return;

        const selectionData = getSelectedTextSegments(node[0]);
        if (!selectionData) return;

        const { fullText, selections } = selectionData;

        let components: any[] = [];
        let lastIndex = 0;

        for (let i = 0; i < selections.length; i++) {
            const { selected, index } = selections[i];

            if (index > lastIndex) {
                components.push({
                    id: nanoid(),
                    type: 'text',
                    tagName: 'span',
                    content: fullText.slice(lastIndex, index),
                });
            }

            components.push({
                id: nanoid(),
                type: 'text',
                tagName: 'i',
                content: selected,
            });

            lastIndex = index + selected.length;
        }

        if (lastIndex < fullText.length) {
            components.push({
                id: nanoid(),
                type: 'text',
                tagName: 'span',
                content: fullText.slice(lastIndex),
            });

        }

        updateById(component.id, { components, content: undefined });
    }

    const handleUnderline = () => {
        const component = selected[0];
        const node = nodes[0];

        if (!component || !node || !isText || !canvas.window) return;

        const selectionData = getSelectedTextSegments(node[0]);
        if (!selectionData) return;

        const { fullText, selections } = selectionData;

        let components: any[] = [];
        let lastIndex = 0;

        for (let i = 0; i < selections.length; i++) {
            const { selected, index } = selections[i];

            if (index > lastIndex) {
                components.push({
                    id: nanoid(),
                    type: 'text',
                    tagName: 'span',
                    content: fullText.slice(lastIndex, index),
                });
            }

            components.push({
                id: nanoid(),
                type: 'text',
                tagName: 'u',
                content: selected,
            });

            lastIndex = index + selected.length;
        }

        if (lastIndex < fullText.length) {
            components.push({
                id: nanoid(),
                type: 'text',
                tagName: 'span',
                content: fullText.slice(lastIndex),
            });

        }

        updateById(component.id, { components, content: undefined });
    }

    const handleBrush = () => {
        const component = selected[0];
        const node = nodes[0];

        if (!component || !node || !isText || !canvas.window) return;

        const selectionData = getSelectedTextSegments(node[0]);
        if (!selectionData) return;

        const { fullText, selections } = selectionData;

        let components: any[] = [];
        let lastIndex = 0;

        for (let i = 0; i < selections.length; i++) {
            const { selected, index } = selections[i];

            if (index > lastIndex) {
                components.push({
                    id: nanoid(),
                    type: 'text',
                    tagName: 'span',
                    content: fullText.slice(lastIndex, index),
                });
            }

            components.push({
                id: nanoid(),
                type: 'text',
                tagName: 'span',
                content: selected,
            });

            lastIndex = index + selected.length;
        }

        if (lastIndex < fullText.length) {
            components.push({
                id: nanoid(),
                type: 'text',
                tagName: 'span',
                content: fullText.slice(lastIndex),
            });

        }

        updateById(component.id, { components, content: undefined });
    }


    useEffect(() => {

        const node = nodes[0];
        if (!node || !isText || !canvas.window || !canvas.document) return;

        const onDoubleClick = (e: MouseEvent) => {
            node.attr("contenteditable", 'true');
            setEditing(true);

            // Give the DOM a tick to set contenteditable
            setTimeout(() => {
                if (!canvas.window || !canvas.document) return;
                const el = node.get(0);
                if (!el) return;

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

        const onClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (!elRef.current?.contains(target) && target != node[0]) {
                const selection = canvas.window?.getSelection();
                if (selection) {
                    selection.removeAllRanges();
                }
                node.removeAttr("contenteditable");
                setEditing(false);
            }
        };

        node.on("dblclick", onDoubleClick as any);
        canvas.window.$(canvas.document)?.on("click", onClickOutside as any);

        return () => {
            node.off("dblclick", onDoubleClick as any);
            if (canvas.document)
                canvas.window?.$(canvas.document)?.off("click", onClickOutside as any);
        }
    }, [nodes, isText]);

    useEffect(() => {
        if (!canvas.window || !canvas.frame || !canvas.document) return;

        const selectionChange = () => {
            if (!canvas.window || !canvas.frame) return;
            const selection = canvas.window.getSelection();
            if (!selection || selection.rangeCount === 0) return;
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const iframeRect = canvas.frame.getBoundingClientRect();
            const x = iframeRect.left + rect.left;
            const y = iframeRect.top + rect.top;
            setCaret({ x, y });
        }

        selectionChange();

        canvas.document.addEventListener('selectionchange', selectionChange);
        return () => {
            canvas.document?.removeEventListener('selectionchange', selectionChange);
        }
    }, [canvas.window, canvas.rect]);


    return (
        <AnimatePresence>
            {shouldVisible && (
                <motion.div
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
                        zIndex: 9999
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
    );
}