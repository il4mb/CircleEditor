import { createContext, useContext, useState, ReactNode } from 'react';
import { ComponentsProvider } from './contexts/ComponentsProvider';
import Component from './entity/Component';
import { TypesProvider } from './contexts/TypesProvider';
import { CanvasProvider } from './contexts/CanvasProvider';
import { StylesProvider } from './contexts/StylesProvider';
import { DevicesProvider } from './contexts/DevicesProvider';
import AppTheme from './theme/AppTheme';

interface CircleEditorState {
    Canvas: any;

}

const CircleEditorProviderContext = createContext<CircleEditorState | undefined>(undefined);

type CircleEditorProviderProps = {
    children?: ReactNode;
    components?: Component[];
}
export const CircleEditorProvider = ({ children, components }: CircleEditorProviderProps) => {

    const [state, setstate] = useState<any>();

    return (
        <AppTheme>
            <CircleEditorProviderContext.Provider value={{ state, setstate }}>
                <TypesProvider>
                    <ComponentsProvider components={components || []}>
                        <DevicesProvider>
                            <CanvasProvider>
                                <StylesProvider>
                                    {children}
                                </StylesProvider>
                            </CanvasProvider>
                        </DevicesProvider>
                    </ComponentsProvider>
                </TypesProvider>

            </CircleEditorProviderContext.Provider>
        </AppTheme>
    );
};

export const useCircleEditor = () => {
    const context = useContext(CircleEditorProviderContext);
    if (!context) throw new Error('useCircleEditorProvider must be used within a CircleEditorProviderProvider');
    return context;
};