import { alpha, IconButton, Stack, Tooltip } from '@mui/material';
import { Bold, Italic, RemoveFormatting, Strikethrough, Underline } from 'lucide-react';
import { ReactNode, useRef, useState } from 'react';
import { getColor } from '../theme/colors';
import { useTextEditor } from '../hooks/texteditor-controller';
import { useTextEditorProvider } from '../contexts/TextEditorProvider';

// Constants
const ALLOWED_TAGS = new Set([
    "a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "data", "dfn",
    "em", "i", "img", "kbd", "mark", "q", "ruby", "s", "samp", "small",
    "span", "strong", "sub", "sup", "time", "u", "var", "wbr"
]);

const FORMAT_TAGS = {
    bold: ['b', 'strong'],
    italic: ['i', 'em'],
    underline: ['u'],
    strike: ['s', 'strike']
};

const FORMAT_ACTIONS = {
    bold: { tag: 'b', icon: <Bold size={14} /> },
    italic: { tag: 'i', icon: <Italic size={14} /> },
    underline: { tag: 'u', icon: <Underline size={14} /> },
    strike: { tag: 's', icon: <Strikethrough size={14} /> }
};


export interface TextEditorToolsProps {
    children?: ReactNode;

}
export default function TextEditorTools({ children, }: TextEditorToolsProps) {

    const { formats } = useTextEditorProvider();

    const toggleFormat = (format: string) => {

    }


    const handleRemoveFormatting = () => {
        // editor.clear();
    }



    return (
        <Stack direction="row" spacing={0} alignItems="center">
            {Object.entries(FORMAT_ACTIONS).map(([format, { icon }]) => (
                <Tooltip key={format} title={format.charAt(0).toUpperCase() + format.slice(1)}>
                    <IconButton
                        sx={{
                            opacity: formats.has(format as any) ? 1 : 0.7,
                            background: formats.has(format as any)
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
                        onClick={() => toggleFormat(format)}>
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
                    onClick={handleRemoveFormatting}>
                    <RemoveFormatting size={14} />
                </IconButton>
            </Tooltip>
        </Stack>
    );
}