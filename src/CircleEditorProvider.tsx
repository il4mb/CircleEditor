import { createContext, useContext, ReactNode, RefObject, useMemo, useEffect } from 'react';
import { ComponentsProvider } from './contexts/ComponentsProvider';
import Component from './entity/Component';
import { TypesProvider } from './contexts/TypesProvider';
import { CanvasProvider } from './contexts/CanvasProvider';
import { StylesProvider } from './contexts/StylesProvider';
import { DevicesProvider } from './contexts/DevicesProvider';
import AppTheme from './theme/AppTheme';
import { ICanvas } from './CircleCanvas';

interface CircleEditor {
    Canvas: ICanvas | null;
}

const CircleEditorProviderContext = createContext<CircleEditor | undefined>(undefined);

type CircleEditorProviderProps = {
    children?: ReactNode;
    components?: Component[];
    canvas: ICanvas | null;
}
export const CircleEditorProvider = ({ children, components, canvas }: CircleEditorProviderProps) => {


    useEffect(() => {
        console.log(canvas)
    }, [canvas])

    const valueState = useMemo<CircleEditor>(() => ({
        Canvas: canvas
    }), [canvas?.document, canvas?.window]);

    return (
        <AppTheme>
            <CircleEditorProviderContext.Provider value={valueState}>
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

export const useCircle = () => {
    const context = useContext(CircleEditorProviderContext);
    if (!context) throw new Error('useCircleEditorProvider must be used within a CircleEditorProviderProvider');
    return context;
};