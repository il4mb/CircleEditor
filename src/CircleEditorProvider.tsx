import { ReactNode, Dispatch, SetStateAction } from 'react';
import { ComponentsProvider } from './contexts/ComponentsProvider';
import Component from './entity/Component';
import { TypesProvider } from './contexts/TypesProvider';
import { CanvasProvider } from './contexts/CanvasProvider';
import { StylesProvider } from './contexts/StylesProvider';
import { DevicesProvider } from './contexts/DevicesProvider';
import AppTheme from './theme/AppTheme';
import { NodesProvider } from './contexts/NodesProvider';
import { OverlayProvider } from './contexts/OverlayProvider';

type CircleEditorProviderProps = {
    children?: ReactNode;
    components?: Component[];
    onComponentsChange: Dispatch<SetStateAction<Component[]>>;
}
export const CircleEditorRegister = ({ children, components, onComponentsChange }: CircleEditorProviderProps) => {
    return (
        <AppTheme>
            <CanvasProvider>
                <TypesProvider>
                    <ComponentsProvider
                        components={components || []}
                        onComponentsChange={onComponentsChange}>
                        <NodesProvider>
                            <DevicesProvider>
                                <OverlayProvider>
                                    <StylesProvider>
                                        {children}
                                    </StylesProvider>
                                </OverlayProvider>
                            </DevicesProvider>
                        </NodesProvider>
                    </ComponentsProvider>
                </TypesProvider>
            </CanvasProvider>
        </AppTheme>
    );
};
