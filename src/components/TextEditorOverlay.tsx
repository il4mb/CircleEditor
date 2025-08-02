import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useComponentsManager } from '../contexts/ComponentsProvider';
import { useCanvas } from '../contexts/CanvasProvider';
import { useSelected } from '../contexts/SelectedProvider';
import { useNodeComponent } from '../contexts/NodesProvider';
import { useTypeOf } from '../contexts/TypesProvider';
import { getColor } from '../theme/colors';

export interface TextEditorOverlayProps {
    children?: ReactNode;
    enabled?: boolean;
}
export default function TextEditorOverlay({ children, enabled = true }: TextEditorOverlayProps) {

    const { updateById } = useComponentsManager();
    const canvas = useCanvas();
    const selected = useSelected();
    const id = useMemo(() => selected?.[0]?.id, [selected]);
    const node = useNodeComponent(id);
    const isText = useTypeOf(selected, 'text');

       const elRef = useRef<HTMLDivElement>(null);

    const [editing, setEditing] = useState(false);
    const [caret, setCaret] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);

    // Derived values
    const shouldVisible = editing && isText && selected.length === 1;
    const x = caret.x - 165;
    const y = caret.y - 85;


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
    };


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


    useEffect(() => {
        const $el = node?.$el;
        if (!$el || !isText) return;

        // $el.on("dblclick", eventOnDoubleClick as any);

        const doc = canvas.document;
        doc?.addEventListener('selectionchange', handleSelectionChange);
        doc?.addEventListener('mousedown', () => setIsDragging(true));
        doc?.addEventListener('mouseup', () => setIsDragging(false));

        return () => {

            setEditing(false);
            $el.removeAttr("contenteditable");
            $el.trigger("blur");
            // $el.off("dblclick", eventOnDoubleClick as any);

            doc?.removeEventListener('selectionchange', handleSelectionChange);
            doc?.removeEventListener('mousedown', () => setIsDragging(true));
            doc?.removeEventListener('mouseup', () => setIsDragging(false));
        };
    }, [node?.component?.id, isText]);

    useEffect(() => {
        if (!canvas.window || !canvas.frame || !canvas.document) return;
        updateCaretPosition();
    }, [canvas.window, canvas.frame, canvas.document]);


    return (
        <AnimatePresence mode='sync'>
            {enabled && (
                <motion.div
                    ref={elRef}
                    key={selected.map(e => e.id).join(',')}
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
                    }}>
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}