import { createContext, useContext, useRef, useState, ReactNode, useEffect, useMemo } from 'react';
import { useComponents, useComponentsManager } from './ComponentsProvider';
import { useTypes } from './TypesProvider';
import Component, { IComponent } from '../entity/Component';
import { useCanvas } from './CanvasProvider';
import { IRect } from '../type'

interface NodeProviderState {
    nodes: JQuery<HTMLElement>[];
    getNodeById: (id: string) => JQuery<HTMLElement> | undefined;
}

const NodeProviderContext = createContext<NodeProviderState | undefined>(undefined);

type NodeProviderProps = {
    children?: ReactNode;
};

export const NodesProvider = ({ children }: NodeProviderProps) => {

    const { findById } = useComponentsManager();
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

        const buildNode = (component: Component, $parent: JQuery<HTMLElement>): JQuery<HTMLElement> | undefined => {

            if (elementMapRef.current.has(component.id)) return;
            if (component.type == "textnode") {
                $parent.append(component.content || '');
                return;
            }
            if (!component.id) return;

            const $el = $(`<${component.tagName || 'div'}>`);

            if ($el.parent()[0] != $parent[0]) {
                $el.appendTo($parent);
            }
            $el.data('cid', component.id);

            // Set attributes
            const attributes = component.attributes || {};
            Object.entries(attributes).forEach(([key, value]) =>
                $el.attr(key, value as any)
            );

            // Set text content
            // $el.text(component.content || '');


            // Recursive render
            if (Array.isArray(component.components)) {
                component.components.forEach((child) => {
                    const $child = buildNode(child, $el);
                    if ($child) $el.append($child);
                });
            }

            elementMapRef.current.set(component.id, $el);

            return $el;
        };

        // Render root components
        components.forEach((comp) => buildNode(comp, $(body)));
        setElements(Array.from(elementMapRef.current.values()));

    }, [components, window, mounted]);


    // Apply type definitions and patch tagName
    useEffect(() => {
        if (!window?.$) return;
        const $ = window.$;
        let modified = false;
        const elements = Array.from(elementMapRef.current.values());

        for (const $el of elements) {

            const element = $el?.get(0);
            const component = findById($el?.data('cid')) as Component;

            if (!component?.id || !element) continue;

            const typeDef = types.find(
                (t) => t.type === component.type || t.isComponent?.(element)
            );

            if (typeDef) {
                const expectedTag = component.tagName || typeDef.model.default?.tagName;
                if (expectedTag && expectedTag.toLowerCase() !== element.tagName.toLowerCase()) {

                    const $new = $(`<${expectedTag}>`);
                    $.each(element.attributes, (_, attr) => {
                        $new.attr(attr.name, attr.value);
                    });
                    $new.append($el.contents());
                    $new.data("cid", component.id);
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


    return (
        <NodeProviderContext.Provider value={{ nodes: elements, getNodeById }}>
            {children}
        </NodeProviderContext.Provider>
    );
}

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

    const nodes = context.nodes.filter($el => components.map(c => c.id).includes($el.attr("id") || $el.data("component")?.id || ''))
    return nodes;
}


type NodeComponent = {
    $el?: JQuery;
    component?: Component;
    parent(): NodeComponent | null;
    children(components: IComponent[]): NodeComponent[];
    append(component: IComponent | IComponent[]): void;
    appendAt(component: IComponent, index: number): void;
    insertBefore(component: IComponent): void;
    insertAfter(component: IComponent): void;
    remove(): void;
    getRect(): IRect;
    getIndex(): number;
    on(event: keyof HTMLElementEventMap, callback: (e: Event) => void): void;
    off(event: keyof HTMLElementEventMap, callback: (e: Event) => void): void;
};


export function useNodeComponent<T extends string | string[]>(id?: T): T extends string[] ? NodeComponent[] : NodeComponent | null {
    const { remove, findById, updateById } = useComponentsManager();
    const context = useContext(NodeProviderContext);
    if (!context) throw new Error("useNodeComponent must be used within a NodesProvider");

    return useMemo(() => {
        const withContext = (id: string): NodeComponent => {
            const model = findById(id);
            const current = context.nodes.find(($el) => $el.data("cid") === id);

            return {
                ...(current && { $el: current }),
                component: model,
                parent() {
                    const parentEl = current?.parent();
                    const parentId = parentEl?.attr('id') || parentEl?.data("component")?.id;
                    if (!parentId) return null;
                    return withContext(parentId);
                },
                children(components) {
                    if (Array.isArray(components)) {
                        if (model)
                            updateById(model.id, { components });
                    }
                    return (model?.components || [])
                        .map(component => withContext(component?.id))
                        .filter(Boolean);
                },
                append(component) {
                    if (!model) return;
                    updateById(model.id, {
                        components: [
                            ...(model.components || []),
                            ...(Array.isArray(component) ? component : [component]),
                        ],
                    });
                },
                appendAt() { /* Implement if needed */ },
                insertBefore() { /* Implement if needed */ },
                insertAfter() { /* Implement if needed */ },
                remove() {
                    current?.remove();
                    remove(id);
                },
                getRect() {
                    const rect = current?.[0]?.getBoundingClientRect();
                    return {
                        x: rect?.x || 0,
                        y: rect?.y || 0,
                        width: rect?.width || 0,
                        height: rect?.height || 0,
                    };
                },
                getIndex() {
                    return current?.index() ?? NaN;
                },
                on(event, callback) {
                    current?.on(event, callback as any);
                },
                off(event, callback) {
                    current?.off(event, callback as any);
                },
            };
        };

        if (!id) return null as any;

        return Array.isArray(id)
            ? id.map(i => withContext(i)).filter(Boolean) as any
            : withContext(id) as any;
    }, [id, context.nodes, findById, remove, updateById]);
}

