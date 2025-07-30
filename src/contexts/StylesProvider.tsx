import { createContext, useContext, useState, ReactNode } from 'react';

interface StylesProviderState {

}

const StylesProviderContext = createContext<StylesProviderState | undefined>(undefined);

type StylesProviderProps = {
    children?: ReactNode;
}
export const StylesProvider = ({ children }: StylesProviderProps) => {
    const [state, setstate] = useState<any[]>();

    return (
        <StylesProviderContext.Provider value={{ state, setstate }}>
            {children}
        </StylesProviderContext.Provider>
    );
};

export const useStylesProvider = () => {
    const context = useContext(StylesProviderContext);
    if (!context) throw new Error('useStylesProvider must be used within a StylesProviderProvider');
    return context;
};