import { Stack } from '@mui/material';
import { ReactNode } from 'react';

export interface PanelLeftProps {
    children?: ReactNode;
}
export default function PanelLeft({ children }: PanelLeftProps) {
    return (
        <Stack flexBasis={300}>

        </Stack>
    );
}