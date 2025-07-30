import { IconButton, MenuItem, Stack, Tooltip } from '@mui/material';
import { ReactNode } from 'react';
import { TextField } from '../styledComponents';
import { useDevicesManager } from '../contexts/DevicesProvider';
import { Blocks, Code, Eraser, Eye, Maximize, Puzzle, Redo, Save, Spotlight, SunMoon, Undo } from 'lucide-react';

export interface PanelTopProps {
    children?: ReactNode;
}
export default function PanelTop({ children }: PanelTopProps) {

    const { devices, active, setActive } = useDevicesManager();

    return (
        <Stack direction={"row"} alignItems={"center"} justifyContent={"space-between"} height={'50px'} px={1}>


            <Stack direction={"row"} alignItems={"center"} gap={1}>
                <Tooltip title="Blocks" arrow>
                    <IconButton color='info'>
                        <Blocks size={14} />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Symbols" arrow>
                    <IconButton color='primary'>
                        <Puzzle size={14} />
                    </IconButton>
                </Tooltip>
            </Stack>


            <Stack direction={"row"} alignItems={"center"} spacing={1}>
                <TextField value={active} sx={{ maxWidth: '300px' }} onChange={(e) => setActive(e.target.value)} size='small' fullWidth select>
                    {devices.map(e => (
                        <MenuItem key={e.name} value={e.name}>
                            {e.name}
                        </MenuItem>
                    ))}
                </TextField>
            </Stack>


            <Stack direction={"row"} alignItems={"center"} gap={1}>

                <Tooltip title="Spotlight" arrow>
                    <IconButton color='primary'>
                        <Spotlight size={14} />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Preview" arrow>
                    <IconButton color='info'>
                        <Eye size={14} />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Full Screeen" arrow>
                    <IconButton color='info'>
                        <Maximize size={14} />
                    </IconButton>
                </Tooltip>

                <Tooltip title="View Code" arrow>
                    <IconButton color='primary'>
                        <Code size={14} />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Save" arrow>
                    <IconButton color='primary'>
                        <Save size={14} />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Clear" arrow>
                    <IconButton color='error'>
                        <Eraser size={14} />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Undo" arrow>
                    <IconButton color='secondary'>
                        <Undo size={14} />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Redo" arrow>
                    <IconButton color='secondary'>
                        <Redo size={14} />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Theme Mode" arrow>
                    <IconButton color='info'>
                        <SunMoon size={14} />
                    </IconButton>
                </Tooltip>

            </Stack>


        </Stack>
    );
}