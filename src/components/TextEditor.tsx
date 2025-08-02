import { alpha, IconButton, Stack, Tooltip } from '@mui/material';
import { Bold, Italic, RemoveFormatting, Strikethrough, Underline } from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { getColor } from '../theme/colors';
import { useTextEditorProvider } from '../contexts/TextEditorProvider';

const FORMAT_ACTIONS = {
    bold: { tag: 'b', icon: <Bold size={14} /> },
    italic: { tag: 'i', icon: <Italic size={14} /> },
    underline: { tag: 'u', icon: <Underline size={14} /> },
    strike: { tag: 's', icon: <Strikethrough size={14} /> }
}

export interface TextEditorProps {
    children?: ReactNode;

}
export default function TextEditor({ children, }: TextEditorProps) {

    const { formats, toggleFormat, clearFormats } = useTextEditorProvider();

    useEffect(() => {
        console.log(formats)
    }, [formats])

    return (
        <Stack
            style={{
                display: 'inline-flex',
                background: getColor('primary')[300],
                borderRadius: '6px',
            }}
            direction="row"
            spacing={0}
            alignItems="center">
            {Object.entries(FORMAT_ACTIONS).map(([format, { icon, tag }]) => (
                <Tooltip key={format} title={format.charAt(0).toUpperCase() + format.slice(1)}>
                    <IconButton
                        sx={{
                            opacity: formats.has(tag as any) ? 1 : 0.7,
                            background: formats.has(tag as any)
                                ? alpha(getColor('primary')[800], 0.2)
                                : 'transparent',
                            borderRadius: 0,
                            width: 32,
                            height: 30,
                            '&:hover': {
                                background: alpha(getColor('primary')[800], 0.1)
                            }
                        }}
                        size="small"
                        onClick={() => toggleFormat(tag as any)}>
                        {icon}
                    </IconButton>
                </Tooltip>
            ))}

            <Tooltip title="Remove formatting">
                <IconButton
                    sx={{
                        borderRadius: 0,
                        width: 32,
                        height: 30,
                        '&:hover': {
                            background: alpha(getColor('primary')[800], 0.1)
                        }
                    }}
                    size="small"
                    onClick={clearFormats}>
                    <RemoveFormatting size={14} />
                </IconButton>
            </Tooltip>
        </Stack>
    );
}