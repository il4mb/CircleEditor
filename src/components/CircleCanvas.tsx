import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import { useComponents } from "../contexts/ComponentsProvider";
import { IDevice, useDevicesManager } from "../contexts/DevicesProvider";
// @ts-ignore
// webpack.config.js should use raw-loader
import jqueryCode from '!!raw-loader!../jquery.js';
import { useCanvas, useCanvasActions } from "../contexts/CanvasProvider";


export default function CircleCanvas() {

    const { window, frame } = useCanvas();
    const { setFrame, setWindow, setRect, setScroll } = useCanvasActions();
    const components = useComponents();
    const [device, setDevice] = useState<IDevice>();
    const { active, getDeviceByName } = useDevicesManager();


    const updateDataRect = () => {
        if (!window || !frame) return;
        const rect = frame.getBoundingClientRect();
        setRect({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
        setScroll(window.scrollY, window.scrollX);
    }

    useEffect(() => {
        if (!window) return;

        updateDataRect();

        const observe = new ResizeObserver(updateDataRect);
        window.addEventListener('scroll', updateDataRect);
        observe.observe(window.document.body);

        return () => {
            window.removeEventListener('scroll', updateDataRect);
            observe.disconnect();
        }
    }, [window]);


    // CANVAS IFRAME MOUNTING
    useEffect(() => {
        if (!frame) return;
        const _win = frame.contentWindow?.window;
        if (!_win) return;

        try {
            // @ts-ignore
            _win.eval(jqueryCode);
        } catch (err) {
            console.error('❌ Injection via eval failed:', err);
        }

        setWindow(_win as any);

    }, [window, frame]);

    // CANVAS SIZE SYNC
    useEffect(() => {
        const activeDevice = getDeviceByName(active);
        if (activeDevice) {
            setDevice(activeDevice);
        }
    }, [active]);


    // COMPONENT SYNC & CORE STYLE
    useEffect(() => {
        if (!window) return;
        let style: HTMLStyleElement | null = null;
        const doc = window.document;
        if (window && doc && 'adoptedStyleSheets' in doc) {
            // @ts-ignore
            const sheet = new window.CSSStyleSheet();
            sheet.replaceSync("body,html { eventsPointer: none; }\n[contenteditable] { outline: none; }");
            doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
        } else {
            style = doc.createElement("style");
            style.textContent = "body,html { eventsPointer: none; }\n[contenteditable] { outline: none; }";
            style.setAttribute("data-injected", "true");
            style.disabled = false;
            doc.head.appendChild(style);
        }

        return () => {
            style?.remove();
        }
    }, [window, components]);


    return (
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'background.paper', overflow: 'hidden' }}>
            <Box sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                transition: 'max-width 0.3s ease',
                maxWidth: device?.maxWidth != Infinity ? device?.maxWidth : '100%',
                overflow: 'hidden'
            }}>
                <iframe
                    // ref={iframeRef}
                    onLoad={(e) => setFrame(e.currentTarget)}
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        border: 'none',
                    }} />
            </Box>
        </Box>
    );
}