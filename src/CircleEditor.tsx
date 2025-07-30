import { Box, Stack } from '@mui/material';
import Component from './entity/Component';
import { CircleEditorProvider } from './CircleEditorProvider';
import CircleCanvas, { ICanvas } from './CircleCanvas';
import PanelTop from './panels/PanelTop';
import PanelLeft from './panels/PanelLeft';
import PanelRight from './panels/PanelRight';
import { useState } from 'react';

export interface IEditorProps {
    components?: Component[];
}

export default function CircleEditor({ components }: IEditorProps) {

    const [canvas, setCanvas] = useState<ICanvas|null>(null);

    return (
        <Stack direction={"row"} sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <CircleEditorProvider components={components} canvas={canvas}>
                <Stack direction={"row"} flex={1}>
                    <PanelLeft />
                    <Stack flex={1}>
                        <PanelTop />
                        <Box flex={1} position={"relative"}>
                            <CircleCanvas onReady={setCanvas}/>
                        </Box>
                    </Stack>
                    <PanelRight />
                </Stack>
            </CircleEditorProvider>
        </Stack>
    );
}
