import { getColor } from "./theme/colors";
import { alpha, TextField as MUITextField, Stack, styled } from "@mui/material";

const forwardProps = (props: string[]) => ({
    shouldForwardProp: (prop: string) => !props.includes(prop)
})

export const TextField = styled(MUITextField, forwardProps(['bordered']))<{ bordered?: boolean }>(({ theme, bordered = true }) => ({
    "& .MuiOutlinedInput-root": {
        background: alpha(getColor('primary')[400], 0.1),
        outline: bordered ? '1px solid' : 'none',
        outlineColor: bordered ? alpha(getColor('primary')[300], 0.75) : '#fff0',
        outlineOffset: '-1px',
        transition: 'outline .2s ease',
        "&:hover": {
            outlineColor: '#fff0',
        },
        "&.Mui-focused": {
            outlineColor: '#fff0',
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: bordered ? getColor('primary')[400] : '#fff0',
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: bordered ? getColor('primary')[500] : '#fff0',
        },
    },
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: '#fff0',
    },
    "& .MuiInputAdornment-positionStart": {
        position: 'relative',
        left: '-5px',
        margin: 0
    },
    "& input": {
        fontSize: '11px',
    },
}));

export const Card = styled(Stack, forwardProps(['gap']))<{ gap?: number }>(({ theme, gap = 12 }) => ({
    gap,
    border: '1px solid',
    borderRadius: 6,
    borderColor: alpha(getColor('primary')[300], 0.5),
    padding: 12,
    transition: 'border-color 0.2s ease, background-color 0.2s ease',
}));