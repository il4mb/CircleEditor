import { ReactNode, Dispatch, SetStateAction } from 'react';
import { ComponentsProvider } from './contexts/ComponentsProvider';
import { IComponent } from './entity/Component';
import { TypesProvider } from './contexts/TypesProvider';
import { CanvasProvider } from './contexts/CanvasProvider';
import { StylesProvider } from './contexts/StylesProvider';
import { DevicesProvider } from './contexts/DevicesProvider';
import AppTheme from './theme/AppTheme';
import { NodesProvider } from './contexts/NodesProvider';
import { OverlayProvider } from './contexts/OverlayProvider';
import { SelectedProvider } from './contexts/SelectedProvider';
import { TextEditorProvider } from './contexts/TextEditorProvider';
import TextEditor from './components/TextEditor';

type CircleEditorProviderProps = {
    children?: ReactNode;
    components?: IComponent[];
    onComponentsChange: Dispatch<SetStateAction<IComponent[]>>;
    textEditor?: ReactNode;
}
export const CircleEditorRegister = ({
    children,
    components,
    textEditor = <TextEditor />,
    onComponentsChange
}: CircleEditorProviderProps) => {

    return (
        <AppTheme>
            <CanvasProvider>
                <TypesProvider>
                    <ComponentsProvider
                        components={components || []}
                        onComponentsChange={onComponentsChange}>
                        <NodesProvider>
                            <SelectedProvider>
                                <DevicesProvider>
                                    <OverlayProvider>
                                        <StylesProvider>
                                            {children}
                                            <TextEditorProvider>
                                                {textEditor}
                                            </TextEditorProvider>
                                        </StylesProvider>
                                    </OverlayProvider>
                                </DevicesProvider>
                            </SelectedProvider>
                        </NodesProvider>
                    </ComponentsProvider>
                </TypesProvider>
            </CanvasProvider>
        </AppTheme>
    );
};
