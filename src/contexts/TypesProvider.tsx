'use client'

import { createContext, useContext, useState, ReactNode, useEffect, useRef, useMemo } from 'react';
import Type, { TypeProxy, TypeDefine } from '../entity/Type';
import { useCanvas } from './CanvasProvider';
import Component from '../entity/Component';

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
                type.type
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

export const useTypeOf = (
    component: Component | Component[] | undefined,
    baseType: string
): boolean => {
    const types = useTypes();

    const getType = (typeName?: string): Type | undefined =>
        types.find((t) => t.type === typeName);

    const isTypeMatch = (typeName: string | undefined, target: string): boolean => {
        let current = getType(typeName);
        while (current) {
            if (current.type === target) return true;
            current = current.extend;
        }
        return false;
    };

    const isMatch = (comp: Component): boolean =>
        isTypeMatch(comp.type, baseType);

    if (!component) return false;

    return Array.isArray(component)
        ? component.some(isMatch)
        : isMatch(component);
};




// Dummy instance types
const BASE_INSTANCES: TypeDefine[] = [
    {
        type: 'text',
        isComponent: (el) =>
            ['P', 'SPAN', 'B', 'I', 'U', 'STRONG', 'EM', 'SMALL', 'MARK', 'DEL', 'INS', 'SUB', 'SUP', 'S', 'CODE', 'Q', 'CITE', 'TIME',]
                .includes(el?.tagName || ''),
        model: {
            default: {
                tagName: 'p',
                editable: true,
            },
        },
    },
    {
        type: 'heading',
        extend: 'text',
        isComponent: (el) => el?.tagName?.startsWith('H'),
        model: {
            default: {
                tagName: 'h1',
            },
            init() {
                console.log('Mounted heading:', this.$el);
            },
        },
    },

    {
        type: 'box',
        isComponent: (el) => el?.tagName?.startsWith('DIV'),
        model: {
            default: {
                tagName: 'div',
            }
        },
    },
];
