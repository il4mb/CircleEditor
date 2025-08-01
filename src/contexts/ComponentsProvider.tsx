import { createContext, useContext, ReactNode, useEffect, useState, useMemo, useCallback, Dispatch, SetStateAction, } from "react";
import Component, { IComponent } from "../entity/Component";
import { nanoid } from "nanoid";
import { isEqual } from "lodash";

// ---------- Context ----------
const Context = createContext<Component[]>([]);
const UpdateContext = createContext<Dispatch<SetStateAction<Component[]>> | null>(null);

// ---------- Props Type ----------
interface ComponentsProviderProps {
    children: ReactNode;
    components: IComponent[];
    onComponentsChange?: (components: IComponent[]) => void;
}

// ---------- Helper ----------
const ensureId = (components: IComponent[]): Component[] =>
    components.map((comp) => {
        const newComp: IComponent = {
            ...comp,
            id: comp.id || nanoid(),
            components: comp.components ? ensureId(comp.components) : undefined,
        };
        return newComp as Component;
    });

function deepUpdateComponent(comps: Component[], id: string, patch: Partial<IComponent>): Component[] {
    return comps.map((comp) => {
        if (comp.id === id) {
            return { ...comp, ...patch } as Component;
        }
        if (Array.isArray(comp.components)) {
            return {
                ...comp,
                components: deepUpdateComponent(comp.components, id, patch),
            };
        }
        return comp;
    });
}


// ---------- Provider ----------
export const ComponentsProvider = ({
    children,
    components: inputComponents,
    onComponentsChange,
}: ComponentsProviderProps) => {

    const ensuredComponents = useMemo(() => ensureId(inputComponents), [inputComponents]);
    const [components, setComponents] = useState<Component[]>(ensuredComponents);

    useEffect(() => {
        setComponents((prev) => {
            if (isEqual(prev, ensuredComponents)) return prev;
            return ensuredComponents;
        });
    }, [ensuredComponents, onComponentsChange]);

    useEffect(() => {
        onComponentsChange?.(components);
    }, [components]);

    return (
        <Context.Provider value={components}>
            <UpdateContext.Provider value={setComponents}>
                {children}
            </UpdateContext.Provider>
        </Context.Provider>
    );
};

// ---------- Hooks ----------
export const useComponents = (): Component[] => {
    const context = useContext(Context);
    if (!context) throw new Error("useComponents must be used within a ComponentsProvider");
    return context;
};


export const useUpdateComponents = () => {
    const setComponents = useContext(UpdateContext);
    if (!setComponents) throw new Error("useUpdateComponents must be used within a ComponentsProvider");

    const update = useCallback((updateFn: (prev: Component[]) => Component[]) => {
        setComponents((prev) => updateFn(prev));
    }, [setComponents]);

    const updateById = (id: string, patch: Partial<IComponent>) => {
        update((prev) => deepUpdateComponent(prev, id, patch));
    };

    return {
        update,
        updateById,
    };
};