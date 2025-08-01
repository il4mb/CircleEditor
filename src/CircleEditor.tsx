import { Box, Stack } from '@mui/material';
import { IComponent } from './entity/Component';
import { CircleEditorRegister } from './CircleEditorProvider';
import PanelTop from './panels/PanelTop';
import PanelLeft from './panels/PanelLeft';
import PanelRight from './panels/PanelRight';
import { Dispatch, SetStateAction } from 'react';
import CircleCanvas from './components/CircleCanvas';

export interface IEditorProps {
    components: IComponent[];
    onComponentsChange: Dispatch<SetStateAction<IComponent[]>>;
}

export default function CircleEditor({ components, onComponentsChange }: IEditorProps) {

    return (
        <Stack direction={"row"} sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <CircleEditorRegister
                components={components}
                onComponentsChange={onComponentsChange}>
                <Stack direction={"row"} flex={1}>
                    <PanelLeft />
                    <Stack flex={1}>
                        <PanelTop />
                        <Box flex={1} position={"relative"}>
                            <CircleCanvas />
                        </Box>
                    </Stack>
                    <PanelRight />
                </Stack>
            </CircleEditorRegister>
        </Stack>
    );
}
