import { createContext, useContext, ReactNode, useEffect, useState, useMemo, useCallback, Dispatch, SetStateAction, } from "react";
import Component, { IComponent } from "../entity/Component";
import { nanoid } from "nanoid";
import { isEqual } from "lodash";
import { useCanvas } from "./CanvasProvider";

// ---------- Context ----------
const Context = createContext<Component[]>([]);
type ManagerContextState = {
    setComponents: Dispatch<SetStateAction<Component[]>>;
    findById(id: string): Component | undefined;
}
const ManagerContext = createContext<ManagerContextState | null>(null);

// ---------- Props Type ----------
interface ComponentsProviderProps {
    children: ReactNode;
    components: IComponent[];
    onComponentsChange?: (components: IComponent[]) => void;
}

// ---------- Helper ----------



// ---------- Provider ----------
export const ComponentsProvider = ({ children, components: inputComponents, onComponentsChange }: ComponentsProviderProps) => {

    const ensureComponent = (components: IComponent[]): Component[] => components.map((comp) => {

        const newComp: IComponent = {
            ...comp,
            ...(comp.type != "textnode" && {
                id: comp.id || nanoid(inputComponents.length + 2),
            })
        }

        if (comp.components) {
            newComp.components = ensureComponent(comp.components)
        }
        if (newComp.content && newComp.type != "textnode") {
            if (!newComp.components)
                newComp.components = [];

            newComp.components.push({
                type: 'textnode',
                content: newComp.content
            });
            delete newComp.content;
        }
        return newComp as Component;
    });

    const ensuredComponents = useMemo(() => ensureComponent(inputComponents), [inputComponents]);
    const [components, setComponents] = useState<Component[]>(ensuredComponents);
    const [flatComponents, setFlatComponents] = useState<Component[]>([]);


    const flattenComponents = (components: Component[]): Component[] => {
        const flattened: Component[] = [];

        const walk = (items: Component[]) => {
            for (const item of items) {
                flattened.push(item);
                if (item.components && item.components.length > 0) {
                    walk(item.components);
                }
            }
        };

        walk(components);
        return flattened;
    }

    const findById = (id: string) => flatComponents.find(e => e.id == id);


    useEffect(() => {
        setComponents((prev) => {
            if (isEqual(prev, ensuredComponents)) return prev;
            return ensuredComponents;
        });
    }, [ensuredComponents, onComponentsChange]);

    useEffect(() => {
        onComponentsChange?.(components);
        setFlatComponents(flattenComponents(components));
    }, [components]);

    return (
        <Context.Provider value={components}>
            <ManagerContext.Provider value={{ setComponents, findById }}>
                {children}
            </ManagerContext.Provider>
        </Context.Provider>
    );
};

// ---------- Hooks ----------
export const useComponents = (): Component[] => {
    const context = useContext(Context);
    if (!context) throw new Error("useComponents must be used within a ComponentsProvider");
    return context;
}


export const useComponentsManager = () => {

    const context = useContext(ManagerContext);
    if (!context) throw new Error("useUpdateComponents must be used within a ComponentsProvider");

    const { setComponents, findById } = context;

    const update = useCallback((updateFn: (prev: Component[]) => Component[]) => {
        setComponents((prev) => updateFn(prev));
    }, [setComponents]);

    const updateById = (id: string, patch: Partial<IComponent>) => {
        update((prev) => {
            const next = prev.map(component =>
                component.id === id
                    ? { ...component, ...patch } as Component
                    : component
            );

            return isEqual(prev, next) ? prev : next;
        });
    };


    const remove = (id: string) => {
        setComponents(prev => prev.filter(e => e.id != id));
    }

    return {
        remove,
        update,
        updateById,
        findById
    }
}

const TEXT_TAG = [
    "a",
    "abbr",
    "b",
    "bdi",
    "bdo",
    "br",
    "cite",
    "code",
    "data",
    "dfn",
    "em",
    "i",
    "img",
    "kbd",
    "mark",
    "q",
    "ruby",
    "s",
    "samp",
    "small",
    "span",
    "strong",
    "sub",
    "sup",
    "time",
    "u",
    "var",
    "wbr"
];

export const useComponentsParser = (fallback?: ((node: HTMLElement) => IComponent | null | undefined)) => {

    const canvas = useCanvas();
    const win = canvas.window;


    const sanitizeToComponents = (node: Node, fallback?: (node: HTMLElement) => IComponent | undefined | null): IComponent[] => {

        const $ = win?.$;
        if (!$) return [];

        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (!text?.trim()) return [];
            return [{
                type: 'textnode',
                content: text
            }];
        }

        const el = node as HTMLElement;
        const tag = el.tagName.toUpperCase();
        if (['SCRIPT', 'STYLE'].includes(tag)) return [];
        if (tag == "P") {
            return [{
                type: 'text',
                tagName: tag,
                content: el.innerHTML || ''
            }];
        }

        const children: IComponent[] = [];
        for (const child of Array.from(el.childNodes)) {
            children.push(...sanitizeToComponents(child, fallback));
        }

        const tagName = tag === 'BR' ? 'br' : tag.toLowerCase();
        if (tagName === 'br') {
            return [{
                type: 'textnode',
                tagName: 'br',
                content: ''
            }];
        }

        const attributes = Object.fromEntries(
            Array.from(el.attributes).map(attr => [attr.name, attr.value])
        );

        const falled = fallback ? fallback(node as HTMLElement) : null;
        if (falled?.type == 'textnode') {
            return [{
                ...falled,
                content: children.map(e => e.content || '').join('')
            }]
        }


        return [{
            id: $(el).data('cid'),
            tagName,
            attributes,
            components: children.length ? children : undefined,
            content: children.length === 0 ? el.textContent?.trim() || '' : undefined,
            ...falled
        }];
    }



    return (html: string) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const body = doc.body;
        const pastedComponents: IComponent[] = [];

        for (const child of Array.from(body.childNodes)) {
            pastedComponents.push(...sanitizeToComponents(child, fallback));
        }
        return pastedComponents;
    }
}