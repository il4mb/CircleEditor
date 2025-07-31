import { createContext, useContext, useRef, useState, ReactNode, useEffect, useMemo } from 'react';
import { useComponents } from './ComponentsProvider';
import { useTypes } from './TypesProvider';
import Component from '../entity/Component';
import { useCanvas } from './CanvasProvider';

interface NodeProviderState {
    nodes: JQuery<HTMLElement>[];
    getNodeById: (id: string) => JQuery<HTMLElement> | undefined;
}

const NodeProviderContext = createContext<NodeProviderState | undefined>(undefined);

type NodeProviderProps = {
    children?: ReactNode;
};

export const NodesProvider = ({ children }: NodeProviderProps) => {

    const { window } = useCanvas();
    const components = useComponents();
    const types = useTypes();
    const elementMapRef = useRef<Map<string, JQuery>>(new Map());
    const [elements, setElements] = useState<JQuery<HTMLElement>[]>([]);

    const getNodeById = useMemo(() => (id: string) => {
        return elementMapRef.current.get(id);
    }, [elements.map(e => e)]);


    useEffect(() => {

        if (!window?.$) return;
        const body = window.document!.body;
        const $ = window.$;

        let changed = false;

        const buildNode = (component: Component, $parent: JQuery<HTMLElement>): JQuery<HTMLElement> | undefined => {

            if (!component.id) return;
            if (elementMapRef.current.has(component.id)) {
                return elementMapRef.current.get(component.id);
            }

            const attributes = component.attributes || {};
            const $el = $(`<${component.tagName || 'div'} id="${component.id}">`);
            console.log($el, $parent)
            $el.appendTo($parent[0]);
            $el.data('component', component);
            Object.entries(attributes).forEach(([key, value]) => {
                $el.attr(key, value as any);
            });
            $el.text(component.content || "");

            // Rekursif untuk children
            if (Array.isArray(component.components)) {
                component.components.forEach(child => {
                    const $child = buildNode(child, $el);
                    if ($child) $el.append($child);
                });
            }
            elementMapRef.current.set(component.id, $el);

            changed = true;
            return $el;
        };

        components.forEach(comp => buildNode(comp, $(body)));

        if (changed) {
            setElements(Array.from(elementMapRef.current.values()));
        }
    }, [components.map(e => e), window?.$]);


    useEffect(() => {

        if (!window?.$) return;
        const $ = window.$;
        let shouldUpdate = false;
        for (const $el of elements) {
            if (!$el) return;

            const component = $el.data("component");
            const element = $el?.get(0);

            if (!component?.id || !component?.type || !element) return;
            const typeDef = component.type ? types.find(t => t.type === component.type || t.isComponent(element)) : null;

            if (typeDef) {

                const tagName = typeDef?.model.default?.tagName;
                if (tagName && tagName.toLowerCase() !== element.tagName.toLowerCase()) {
                    const $new = $(`<${tagName} id="${component.id}">`);
                    $.each(element.attributes, (_, attr) => {
                        $new.attr(attr.name, attr.value);
                    });
                    $new.append($el.contents());
                    $el.replaceWith($new);
                    elementMapRef.current.set(component.id, $new);
                }

                typeDef.model.init?.();
                shouldUpdate = true;
            }

        }

        if (shouldUpdate) {
            setElements(Array.from(elementMapRef.current.values()));
            console.log("Update")
        }


    }, [components, elements, types.map(e => e)]);


    const contextValue = useMemo(() => ({
        nodes: elements, getNodeById
    }), [elements, getNodeById])


    return (
        <NodeProviderContext.Provider value={contextValue}>
            {children}
        </NodeProviderContext.Provider>
    );
};

export const useNodes = () => {
    const context = useContext(NodeProviderContext);
    if (!context)
        throw new Error('useNodes must be used within a NodesProvider');
    return context;
};
