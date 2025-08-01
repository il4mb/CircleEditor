import { Box, Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';
import TabsContext from '../components/TabsContext';
import { useSelected } from '../contexts/SelectedProvider';

export interface PanelRightProps {
    children?: ReactNode;
}
export default function PanelRight({ children }: PanelRightProps) {

    const selected = useSelected();
    

    return (
        <Stack flexBasis={250} pt={1}>
            <TabsContext tabs={["styles", "properties", "events"]}>
                <Box>
                    <Typography>Styles</Typography>
                </Box>
                <Box>
                    <Typography>Props</Typography>
                </Box>
                <Box>
                    <Typography>Events</Typography>
                </Box>
            </TabsContext>

        </Stack>
    );
}