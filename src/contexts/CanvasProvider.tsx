import { createContext, useContext, useState, ReactNode } from 'react';
import { IRect } from '../type';

export interface CanvasWindow extends Window {
    $: JQueryStatic;
}

interface CanvasState {
    frame?: HTMLIFrameElement;
    window?: CanvasWindow;
    document?: Document;
    scrollTop: number;
    scrollLeft: number;
    rect: IRect;
}

interface CanvasActions {
    setFrame: (el: HTMLIFrameElement) => void;
    setWindow: (win: CanvasWindow) => void;
    setScroll: (top: number, left: number) => void;
    setRect: (rect: IRect) => void;
}

const CanvasStateContext = createContext<CanvasState | undefined>(undefined);
const CanvasActionsContext = createContext<CanvasActions | undefined>(undefined);

type CanvasProviderProps = {
    children?: ReactNode;
};

export const CanvasProvider = ({ children }: CanvasProviderProps) => {
    const [frame, setFrame] = useState<HTMLIFrameElement>();
    const [win, setWin] = useState<CanvasWindow>();
    const [scrollTop, setScrollTop] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [rect, setRect] = useState<IRect>({ x: 0, y: 0, width: 0, height: 0 });

    const stateValue: CanvasState = {
        frame,
        window: win,
        document: win?.document,
        scrollTop,
        scrollLeft,
        rect,
    };

    const actionsValue: CanvasActions = {
        setFrame: (el) => setFrame(el),
        setWindow: setWin,
        setScroll: (top, left) => {
            setScrollTop(top);
            setScrollLeft(left);
        },
        setRect,
    };

    return (
        <CanvasStateContext.Provider value={stateValue}>
            <CanvasActionsContext.Provider value={actionsValue}>
                {children}
            </CanvasActionsContext.Provider>
        </CanvasStateContext.Provider>
    );
};

// Hook untuk membaca state canvas
export const useCanvas = () => {
    const context = useContext(CanvasStateContext);
    if (!context)
        throw new Error('useCanvas must be used within a CanvasProvider');
    return context;
};

// Hook untuk mengubah state canvas (internal)
export const useCanvasActions = () => {
    const context = useContext(CanvasActionsContext);
    if (!context)
        throw new Error('useCanvasActions must be used within a CanvasProvider');
    return context;
};
