'use client'

import { Box, Button, Stack } from "@mui/material";
import { Children, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

export interface ITabContextProps {
    tabs: string[];
    children: ReactNode;
    initialKey?: number;
}

export default function TabsContext({ tabs, children, initialKey = 0 }: ITabContextProps) {
    
    const [direction, setDirection] = useState<"left" | "right">("right");
    const [active, setActive] = useState(initialKey);
    const elements = useMemo(() => Children.toArray(children), [children]);
    const activeButtonRef = useRef<HTMLButtonElement>(null);
    const [indicator, setIndicator] = useState({ width: 0, x: 0 });

    const handleSetActive = (index: number) => {
        setActive(prev => {
            setDirection(prev > index ? "left" : "right");
            return index;
        });
    };

    useEffect(() => {
        if (activeButtonRef.current) {
            const btn = activeButtonRef.current;
            setIndicator({
                x: btn.offsetLeft,
                width: btn.clientWidth
            });
        }
    }, [activeButtonRef.current, active]);

    return (
        <Stack flex={1} overflow={"hidden"}>
            <Box sx={{ position: "relative", pb: 0.75 }}>
                <Stack direction="row" justifyContent="center" alignItems="center">
                    {tabs.map((title, i) => (
                        <Button
                            size="small"
                            ref={active === i ? activeButtonRef : null}
                            onClick={() => handleSetActive(i)}
                            key={i}
                            sx={{
                                py: 0.4,
                                minWidth: 80,
                                position: "relative"
                            }}>
                            {title}
                        </Button>
                    ))}
                </Stack>

                <motion.div
                    layout
                    layoutId="tab-indicator"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                    style={{
                        position: "absolute",
                        bottom: 0,
                        height: 3,
                        width: indicator.width,
                        background: "#1976d2",
                        borderRadius: 2,
                        left: indicator.x
                    }}
                />
            </Box>

            <Stack flex={1} overflow="auto" position="relative">
                {elements.map((child, i) => (
                    <motion.div
                        key={i}
                        initial={false}
                        animate={{
                            opacity: i === active ? 1 : 0,
                            x: i === active ? 0 : (i < active ? -20 : 20),
                            position: i === active ? "relative" : "absolute",
                            zIndex: i === active ? 1 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                        style={{
                            width: "100%",
                            height: "100%",
                            pointerEvents: i === active ? "auto" : "none"
                        }}>
                        {child}
                    </motion.div>
                ))}
            </Stack>
        </Stack>
    );
}
