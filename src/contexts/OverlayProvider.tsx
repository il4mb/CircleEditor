import { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { useNodes } from './NodesProvider';
import { useComponents } from './ComponentsProvider';
import { Box } from '@mui/material';
import { useCanvas } from './CanvasProvider';
import { getColor } from '../theme/colors';
import { motion } from "framer-motion";

interface OverlayProviderState {

}

const OverlayProviderContext = createContext<OverlayProviderState | undefined>(undefined);

type OverlayProviderProps = {
    children?: ReactNode;
}
export const OverlayProvider = ({ children }: OverlayProviderProps) => {

    const components = useComponents();
    const { nodes } = useNodes();
    const canvas = useCanvas();
    const [mouseXY, setMouseXY] = useState({ x: 0, y: 0 });
    const [rect, setRect] = useState<DOMRect>();


    useEffect(() => {

        const onMouseMove = (e: MouseEvent) => setMouseXY({ x: e.pageX, y: e.pageY });
        if (canvas.window) canvas.window.addEventListener("mousemove", onMouseMove);
        return () => {
            canvas.window?.removeEventListener("mousemove", onMouseMove);
        }
    }, [canvas]);


    useEffect(() => {

        if (!canvas.window || !canvas.document) return;
        const { x, y } = mouseXY;
        const hover = canvas.document.elementFromPoint(x, y);
        if (hover && !["html", "body"].includes(hover.tagName.toLowerCase())) {
            setRect(hover.getBoundingClientRect())
        } else {
            setRect(undefined);
        }

    }, [mouseXY, canvas, nodes]);

    return (
        <OverlayProviderContext.Provider value={{}}>

            {children}

            <Box sx={{
                position: 'fixed',
                top: canvas.rect.y + 'px',
                left: canvas.rect.x + 'px',
                width: canvas.rect.width + 'px',
                height: canvas.rect.height + 'px',
                pointerEvents: 'none'
            }}>
                {rect && (
                    <motion.div
                        initial={{
                            top: rect.top + 'px',
                            left: rect.left + 'px',
                            width: (rect.width || 0) + 'px',
                            height: (rect.height || 0) + 'px',
                            opacity: 0,
                            scale: 0.9
                        }}
                        animate={{
                            top: rect.top + 'px',
                            left: rect.left + 'px',
                            width: (rect.width || 0) + 'px',
                            height: (rect.height || 0) + 'px',
                            opacity: 1,
                            scale: 1
                        }}
                        style={{
                            position: 'absolute',
                            outline: '1px solid ' + getColor('primary')[400],
                            outlineOffset: '1.5px',
                        }} />
                )}
            </Box>
        </OverlayProviderContext.Provider>
    );
};

export const useOverlayProvider = () => {
    const context = useContext(OverlayProviderContext);
    if (!context) throw new Error('useOverlayProvider must be used within a OverlayProviderProvider');
    return context;
};