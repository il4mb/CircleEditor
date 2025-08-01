import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import Component from '../entity/Component';
import { useCanvas } from './CanvasProvider';
import { useDelay } from '../utility';

const Context = createContext<Component[]>([]);

type SelectedProviderProps = {
    children?: ReactNode;
};

export const SelectedProvider = ({ children }: SelectedProviderProps) => {

    const canvas = useCanvas();
    const [selectedComponents, setSelectedComponents] = useState<Component[]>([]);

    const onMouseDown = useDelay(100, (e: MouseEvent) => {
        if (!canvas.window || !canvas.document) return;

        const $ = canvas.window.$;
        const [x, y] = [e.pageX, e.pageY];

        const element = canvas.document.elementFromPoint(x, y) as HTMLElement | null;
        if (!element) return;

        const component = ($(element).data("component") ?? null) as Component | null;
        if (!component) return;

        const isShift = e.shiftKey;
        const isCtrl = e.ctrlKey || e.metaKey; // metaKey for Cmd on Mac

        setSelectedComponents(prev => {
            const alreadySelected = prev.find(c => c.id === component.id);

            if (isShift || isCtrl) {
                if (alreadySelected) {
                    return prev.filter(c => c.id !== component.id); // unselect
                } else {
                    return [...prev, component]; // add to selection
                }
            } else {
                return [component]; // single select
            }
        });
    }, [canvas.window]);


    useEffect(() => {
        const win = canvas.window;
        if (!win) return;

        win.addEventListener("mousedown", onMouseDown);
        return () => {
            win.removeEventListener("mousedown", onMouseDown);
        };
    }, [canvas.window]);

    return (
        <Context.Provider value={selectedComponents}>
            {children}
        </Context.Provider>
    );
};

export const useSelected = () => {
    const context = useContext(Context);
    if (!context) throw new Error('useSelectedProvider must be used within a SelectedProvider');
    return context;
}