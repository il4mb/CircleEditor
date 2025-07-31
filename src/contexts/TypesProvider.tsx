'use client'

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import Type, { TypeDefine } from '../entity/Type';
import { useCanvas } from './CanvasProvider';

const InstancesProviderContext = createContext<Type[]>([]);

type InstancesProviderProps = {
    children: ReactNode;
};

export const TypesProvider = ({ children }: InstancesProviderProps) => {

    const canvas = useCanvas();
    const typesRef = useRef<Map<string, Type>>(new Map());
    const [types, setTypes] = useState<Type[]>([]);

    useEffect(() => {
        if (!canvas.window) return;

        BASE_INSTANCES.forEach((t) => {
            if (!typesRef.current.has(t.type)) {
                const type = new Type(t);
                // Inheritance via `extend`
                if (t.extend && typesRef.current.has(t.extend)) {
                    type.extend = typesRef.current.get(t.extend);
                }
                typesRef.current.set(t.type, type);
            }
        });
        setTypes(Array.from(typesRef.current.values()));
    }, [canvas.window]);

    return (
        <InstancesProviderContext.Provider value={types}>
            {children}
        </InstancesProviderContext.Provider>
    );
};

export const useTypes = () => {
    const context = useContext(InstancesProviderContext);
    if (!context) throw new Error('useTypes must be used within a TypesProvider');
    return context;
}

// Dummy instance types
const BASE_INSTANCES: TypeDefine[] = [
    {
        type: 'text',
        isComponent: (el) => false,
        model: {
            default: {
                tagName: 'p',
                editable: true,
            },
            init() {

            },
      
        },
    },
    {
        type: 'heading',
        extend: 'text',
        model: {
            default: {
                tagName: 'h1',
            },
            init() {
                // console.log('Mounted heading:', this.component.$el);
            },
        },
    },
];
