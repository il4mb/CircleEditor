"use client"

import { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import Component from '../entity/Component';
import { nanoid } from 'nanoid';
import { isEqual } from 'lodash';

const Context = createContext<Component[]>([]);

type ComponentsProviderProvider = {
    children: ReactNode;
    components: Component[];
    onComponentsChange?: (components: Component[]) => void;
};

export const ComponentsProvider = ({ children, components, onComponentsChange }: ComponentsProviderProvider) => {
    
    const previous = useRef<Component[]>([]);
    const assignId = (components: Component[]): Component[] => components.map((comp) => {
        if (!comp.id) comp.id = nanoid(components.length + 1);
        if (comp.components) {
            comp.components = assignId(comp.components);
        }
        return comp;
    });


    // Generate IDs if missing
    const processedComponents = assignId(components);

    // Only notify when changed
    useEffect(() => {
        if (!isEqual(previous.current, processedComponents)) {
            previous.current = processedComponents;
            onComponentsChange?.(processedComponents);
        }
    }, [processedComponents, onComponentsChange]);

    return (
        <Context.Provider value={processedComponents}>
            {children}
        </Context.Provider>
    );
};

export const useComponents = () => {
    const context = useContext(Context);
    if (!context) throw new Error('useComponents must be used within a ComponentsProvider');
    return context;
};
