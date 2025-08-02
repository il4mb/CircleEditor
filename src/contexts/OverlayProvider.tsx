import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNodeComponent, useNodes } from './NodesProvider';
import { Box } from '@mui/material';
import { useCanvas } from './CanvasProvider';
import { getColor } from '../theme/colors';
import { motion } from "framer-motion";
import { isEqual } from 'lodash';
import { useSelected } from './SelectedProvider';
import { IRect } from '../type';

interface OverlayProviderState {

}

const OverlayProviderContext = createContext<OverlayProviderState | undefined>(undefined);

type OverlayProviderProps = {
    children?: ReactNode;
}
export const OverlayProvider = ({ children }: OverlayProviderProps) => {

    const selected = useSelected();
    const nodes = useNodeComponent(selected.map(e => e.id));
    const selectedRects = nodes.map(n => n.getRect());


    const isMultipleSelected = selected.length > 1;

    //const nodes = useNodes();
    const canvas = useCanvas();
    const [mouseXY, setMouseXY] = useState({ x: 0, y: 0 });
    const [rect, setRect] = useState<DOMRect>();

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => setMouseXY({ x: e.pageX, y: e.pageY });
        if (canvas.window) canvas.window.addEventListener("mousemove", onMouseMove);
        return () => {
            canvas.window?.removeEventListener("mousemove", onMouseMove);
        }
    }, [canvas.window]);



    
    // useEffect(() => {

    //     if (!canvas.window || !canvas.document) return;
    //     const { x, y } = mouseXY;
    //     const hover = canvas.document.elementFromPoint(x, y);
    //     setRect(prev => {

    //         let newRect: DOMRect | undefined = undefined;
    //         if (hover && !["html", "body"].includes(hover.tagName.toLowerCase())) {
    //             newRect = hover.getBoundingClientRect();
    //         }
    //         return isEqual(prev, newRect) ? prev : newRect;
    //     });

    // }, [mouseXY, canvas.window, nodes]);


    const renderSelectedBox = (r: IRect, i: number) => (
        <Box
            key={i}
            style={{
                position: 'absolute',
                outline: '1.4px solid ' + getColor('primary')[400],
                outlineOffset: '1.5px',
                zIndex: 999,
                top: r.y + 'px',
                left: r.x + 'px',
                width: (r.width || 0) + 'px',
                height: (r.height || 0) + 'px',
                opacity: 1,
                scale: 1
            }} />
    )

    return (
        <OverlayProviderContext.Provider value={{}}>

            {children}

            <Box sx={{
                position: 'fixed',
                top: canvas.rect.y + 'px',
                left: canvas.rect.x + 'px',
                width: canvas.rect.width + 'px',
                height: canvas.rect.height + 'px',
                pointerEvents: 'none',
                overflow:'hidden'
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
                            outline: '1px solid ' + getColor('warning')[400],
                            outlineOffset: '1.5px',
                        }} />
                )}

                {selectedRects.map(renderSelectedBox)}

            </Box>
        </OverlayProviderContext.Provider>
    );
};

export const useOverlayProvider = () => {
    const context = useContext(OverlayProviderContext);
    if (!context) throw new Error('useOverlayProvider must be used within a OverlayProviderProvider');
    return context;
};