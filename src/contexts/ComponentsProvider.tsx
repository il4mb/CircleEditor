"use client"

import { createContext, useContext, useState, ReactNode, useEffect, Dispatch, SetStateAction } from 'react';
import Component, { ComponentDefine } from '../entity/Component';
import { isEqual } from 'lodash';
import { useTypes } from './TypesProvider';

interface ComponentsProviderState {
    components: Component[];
    setComponents: Dispatch<SetStateAction<Component[]>>
}

const ComponentsProviderContext = createContext<ComponentsProviderState | undefined>(undefined);

type ComponentsProviderProvider = {
    children: ReactNode;
    components: (ComponentDefine | Component)[];
}


export const ComponentsProvider = ({ children, components: defineComponents }: ComponentsProviderProvider) => {

    const { types } = useTypes();
    const [components, setComponents] = useState<Component[]>([]);


    useEffect(() => {
        setComponents(prev => {
            const newComponents = defineComponents.map<Component>((define: any) => {
                if (!(define as any).id) {
                    return new Component(define);
                }
                return define;
            });
            if (isEqual(prev, newComponents)) return prev;
            return newComponents;
        })
    }, [defineComponents]);



    return (
        <ComponentsProviderContext.Provider value={{ components, setComponents }}>
            {children}
        </ComponentsProviderContext.Provider>
    );
}



export const useComponents = () => {
    const context = useContext(ComponentsProviderContext);
    if (!context) throw new Error('useComponentsProvider must be used within a ComponentsProviderProvider');
    return context;
}


