import { createContext, useContext, useRef, useState, ReactNode, useEffect, useMemo } from 'react';
import { useComponents } from './ComponentsProvider';
import { useTypes } from './TypesProvider';
import Component from '../entity/Component';
import { useCanvas } from './CanvasProvider';
import Type from '../entity/Type';

interface NodeProviderState {
    nodes: JQuery<HTMLElement>[];
    getNodeById: (id: string) => JQuery<HTMLElement> | undefined;
}

const NodeProviderContext = createContext<NodeProviderState | undefined>(undefined);

type NodeProviderProps = {
    children?: ReactNode;
};

export const NodesProvider = ({ children }: NodeProviderProps) => {

    const { window, frame } = useCanvas();
    const components = useComponents();
    const types = useTypes();
    const [mounted, setMounted] = useState(false);
    const elementMapRef = useRef<Map<string, JQuery>>(new Map());
    const [elements, setElements] = useState<JQuery<HTMLElement>[]>([]);
    const getNodeById = useMemo(() => (id: string) => elementMapRef.current.get(id), []);

    useEffect(() => {
        setMounted(true);
        return () => {
            elementMapRef.current.clear();
            setElements([]);
            setMounted(false);
        }
    }, [window]);


    // Initial node creation from component tree
    useEffect(() => {
        if (!window?.$ || !mounted) return;
        const body = window.document!.body;
        const $ = window.$;
        let changed = false;

        const buildNode = (component: Component, $parent: JQuery<HTMLElement>): JQuery<HTMLElement> | undefined => {

            if (!component.id) return;
            const $el = elementMapRef.current.has(component.id)
                ? elementMapRef.current.get(component.id)!
                : $(`<${component.tagName || 'div'} id="${component.id}">`);

            if ($el.parent()[0] != $parent[0]) {
                $el.appendTo($parent);
            }
            $el.data('component', component);

            // Set attributes
            const attributes = component.attributes || {};
            Object.entries(attributes).forEach(([key, value]) =>
                $el.attr(key, value as any)
            );

            // Set text content
            $el.text(component.content || '');


            // Recursive render
            if (Array.isArray(component.components)) {
                component.components.forEach((child) => {
                    const $child = buildNode(child, $el);
                    if ($child) $el.append($child);
                });
            }

            elementMapRef.current.set(component.id, $el);
            changed = true;
            return $el;
        };

        // Render root components
        components.forEach((comp) => buildNode(comp, $(body)));

        // if (changed) {
        setElements(Array.from(elementMapRef.current.values()));
        // }
    }, [components, window, mounted]);


    // Apply type definitions and patch tagName
    useEffect(() => {
        if (!window?.$) return;
        const $ = window.$;
        let modified = false;
        const elements = Array.from(elementMapRef.current.values());

        for (const $el of elements) {

            const element = $el?.get(0);
            const component = $el?.data('component') as Component;

            if (!component?.id || !element) continue;

            const typeDef = types.find(
                (t) => t.type === component.type || t.isComponent?.(element)
            );

            if (typeDef) {
                const expectedTag = typeDef.model.default?.tagName;
                if (expectedTag && expectedTag.toLowerCase() !== element.tagName.toLowerCase()) {

                    const $new = $(`<${expectedTag} id="${component.id}">`);
                    $.each(element.attributes, (_, attr) => {
                        $new.attr(attr.name, attr.value);
                    });
                    $new.append($el.contents());
                    $new.data("component", component);
                    $el.replaceWith($new);
                    elementMapRef.current.set(component.id, $new);
                    typeDef._init($new, component);
                }

                modified = true;
            }
        }

        if (modified) {
            setElements(Array.from(elementMapRef.current.values()));
        }

        return () => {

        }
    }, [types, window]);



    const contextValue = useMemo<NodeProviderState>(() => ({
        nodes: elements,
        getNodeById,
    }), [elements]);

    return (
        <NodeProviderContext.Provider value={{ nodes: elements, getNodeById }}>
            {children}
        </NodeProviderContext.Provider>
    );
};

// Overloads
export function useNodes(): JQuery<HTMLElement>[];
export function useNodes(id: string): JQuery<HTMLElement> | undefined;
export function useNodes(ids: string[]): JQuery<HTMLElement>[];
export function useNodes(id?: any): any {
    const context = useContext(NodeProviderContext);
    if (!context) {
        throw new Error('useNodes must be used within a NodesProvider');
    }

    if (id) {
        if (Array.isArray(id)) {
            return context.nodes.filter($el => id.includes($el.attr("id") || ''));
        }
        return context.nodes.find($el => $el.attr("id") == id);
    }

    return context.nodes;
};

export const useNodeComponents = (components: Component[]) => {
    const context = useContext(NodeProviderContext);
    if (!context) {
        throw new Error('useNodes must be used within a NodesProvider');
    }

    return context.nodes.filter($el =>
        components.map(c => c.id).includes($el.attr("id")
            || $el.data("component")?.id || '')
    );
}