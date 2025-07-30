import { createContext, useContext, useState, ReactNode } from 'react';

interface CanvasProviderState {

}

const CanvasProviderContext = createContext<CanvasProviderState | undefined>(undefined);

type CanvasProviderProps = {
    children?: ReactNode;
}
export const CanvasProvider = ({ children }: CanvasProviderProps) => {
    const [state, setstate] = useState<any>();

    return (
        <CanvasProviderContext.Provider value={{ state, setstate }}>
            {children}
        </CanvasProviderContext.Provider>
    );
};

export const useCanvasProvider = () => {
    const context = useContext(CanvasProviderContext);
    if (!context) throw new Error('useCanvasProvider must be used within a CanvasProviderProvider');
    return context;
};