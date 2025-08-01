import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import Component from '../entity/Component';
import { useCanvas } from './CanvasProvider';
import { useDelay } from '../utility';
import { useComponentsManager } from './ComponentsProvider';
import { isEqual } from 'lodash';

const Context = createContext<Component[]>([]);

type SelectedProviderProps = {
    children?: ReactNode;
};

export const SelectedProvider = ({ children }: SelectedProviderProps) => {

    const { findById } = useComponentsManager();
    const canvas = useCanvas();
    const [selectedComponents, setSelectedComponents] = useState<Component[]>([]);
    const selected = useMemo(() => selectedComponents, [selectedComponents.map(e => e.id)]);

    function findComponentElementUpward(startEl: HTMLElement, $: any): HTMLElement | null {
        let el: HTMLElement | null = startEl;
        while (el) {
            const cid = $(el).data("cid");
            if (cid) return el;
            el = el.parentElement;
        }
        return null;
    }


    const onMouseDown = useDelay(100, (e: MouseEvent) => {
        if (!canvas.window || !canvas.document) return;

        const $ = canvas.window.$;
        const [x, y] = [e.pageX, e.pageY];
        const element = canvas.document.elementFromPoint(x, y) as HTMLElement | null;
        if (!element) return;

        const resolvedEl = findComponentElementUpward(element, $);
        if (!resolvedEl) return;

        const component = findById($(resolvedEl).data("cid"));
        if (!component) return;

        const isShift = e.shiftKey;
        const isCtrl = e.ctrlKey || e.metaKey;

        setSelectedComponents(prev => {
            const alreadySelected = prev.find(c => c.id === component.id);
            let newSelected: any[] = [];

            if (isShift || isCtrl) {
                if (alreadySelected) {
                    newSelected = prev.filter(c => c.id !== component.id);
                } else {
                    newSelected = [...prev, component];
                }
            } else {
                newSelected = [component];
            }

            return isEqual(newSelected, prev) ? prev : newSelected;
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
        <Context.Provider value={selected}>
            {children}
        </Context.Provider>
    );
};

export const useSelected = () => {
    const context = useContext(Context);
    if (!context) throw new Error('useSelectedProvider must be used within a SelectedProvider');
    return context;
}