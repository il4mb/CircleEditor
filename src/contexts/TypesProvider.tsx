'use client'

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import Type, { TypeDefine } from '../entity/Type';
import { useCircle } from '../CircleEditorProvider';

interface InstancesProviderState {
    types: Type[];
}

const InstancesProviderContext = createContext<InstancesProviderState | undefined>(undefined);

type InstancesProviderProps = {
    children: ReactNode;
};

export const TypesProvider = ({ children }: InstancesProviderProps) => {

    const editor = useCircle();
    const typesRef = useRef<Map<string, Type>>(new Map());
    const [types, setTypes] = useState<Type[]>([]);

    useEffect(() => {
        if(!editor.Canvas) return;
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
    }, [editor.Canvas]);

    return (
        <InstancesProviderContext.Provider value={{ types }}>
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
        model: {
            default: {
                tagName: 'p',
                editable: true,
            },
            init(el) {
                el?.on('dblclick', () => {
                    this.model.onDoubleClick(el);
                });
                el?.on("blur", () => el.removeAttr('contentEditable'))
            },
            onDoubleClick(el: JQuery) {
                el.attr("contentEditable", 'true');
                el.trigger("focus");
            }
        },
    },
    {
        type: 'heading',
        extend: 'text',
        model: {
            default: {
                tagName: 'h1',
            },
            init(el) {
                console.log('Mounted heading:', this.component.$el);
            },
        },
    },
];
