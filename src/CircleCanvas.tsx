import { Box } from "@mui/material";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import Component from "./entity/Component";
import { useComponents } from "./contexts/ComponentsProvider";
import { useTypes } from "./contexts/TypesProvider";
import { ICanvasRect, IRect } from "./type";
import { IDevice, useDevicesManager } from "./contexts/DevicesProvider";
// @ts-ignore
// webpack.config.js should use raw-loader
import jquery from '!!raw-loader!./jquery.js';


export interface CanvasWindow extends Window {
    $: jquery;
}


export interface ICanvasRef {
    rect: ICanvasRect;
    render: () => void;
    clear: () => void;
    reload: () => void;
}

export interface ICanvasProps { }

const CircleCanvas = forwardRef<ICanvasRef, ICanvasProps>(({ }, ref) => {

    const mountedRef = useRef(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const winRef = useRef<CanvasWindow>(null);
    const { components } = useComponents();
    const { types } = useTypes();
    const [rect, setRect] = useState<IRect>({ x: 0, y: 0, width: 0, height: 0 });
    const [scrollTop, setScrollTop] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [device, setDevice] = useState<IDevice>();
    const { active, getDeviceByName } = useDevicesManager();


    const renderComponent = (component: Component, win: CanvasWindow): JQuery<HTMLElement> => {
        const $ = win.$;
        if (!component.$el && component.type) {
            const type = types.find(t => t.type === component.type);
            if (type) {
                const _default = type.model.default;
                component.$el = $(`<${_default.tagName.trim()}>`);
                type.model.init?.bind({ component, model: type.model })(component.$el);
            }
        }

        if (!component.$el) {
            console.log(component)
            component.$el = $(`<${component.tagName.trim()}>`);
        }

        const el = component.$el!;
        el.attr('id', component.id);
        el.text(component.content || '');

        // if (component.components?.length) {
        //     component.components.forEach(child => {
        //         if (!el.children(`#${CSS.escape(child.id)}`)) {
        //             const childEl = renderComponent(child, win);
        //             el.append(childEl);
        //         }
        //     });
        // }

        return el;
    };

    const render = () => {
        const win = winRef.current;
        if (!win || !win.$) return;
        components.forEach(component => {
            const el = renderComponent(component, win);
            if (el) win.$(win.document.body).append(el);
        });
    };

    const clear = () => {
        const doc = iframeRef.current?.contentDocument;
        if (doc) doc.body.innerHTML = '';
    };

    const reload = () => {
        clear();
        render();
    };

    const updateDataRect = () => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        const win = iframe.contentWindow;
        if (!win) return;

        const rect = iframe.getBoundingClientRect();
        setRect(rect);
        setScrollTop(win.scrollY || 0);
        setScrollLeft(win.scrollX || 0);
    }

    const observe = useMemo(() => new ResizeObserver(updateDataRect), []);

    // UNMOUNT 
    useEffect(() => {
        const win = winRef.current;
        return () => {
            win?.removeEventListener('scroll', updateDataRect);
            observe.disconnect();
        }
    }, []);

    // CANVAS IFRAME MOUNTING
    useEffect(() => {
        if (!iframeRef.current || mountedRef.current) return;
        const iframe = iframeRef.current;
        const win = iframe.contentWindow;
        if (!win) return;

        try {
            // @ts-ignore
            win.eval(jquery);
        } catch (err) {
            console.error('❌ Injection via eval failed:', err);
        }

        updateDataRect();
        win.addEventListener('scroll', updateDataRect);
        observe.observe(win.document.body);
        mountedRef.current = true;
        winRef.current = win as any;

    }, [iframeRef.current, components, types.map(e => e.type)]);


    // CANVAS SIZE SYNC
    useEffect(() => {
        const activeDevice = getDeviceByName(active);
        if (activeDevice) {
            setDevice(activeDevice);
        }
    }, [active]);


    // COMPONENT SYNC & CORE STYLE
    useEffect(() => {
        if (!winRef.current) return;
        const win = winRef.current;
        if (!win) return;
        let style: HTMLStyleElement | null = null;
        const doc = win.document;
        if (win && doc && 'adoptedStyleSheets' in doc) {
            // @ts-ignore
            const sheet = new win.CSSStyleSheet();
            sheet.replaceSync("[contenteditable] { outline: none; }");
            doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
        } else {
            style = doc.createElement("style");
            style.textContent = "[contenteditable] { outline: none; }";
            style.setAttribute("data-injected", "true");
            style.disabled = false;
            doc.head.appendChild(style);
        }

        render();
        return () => {
            style?.remove();
        }
    }, [components, types.map(t => t.type)]);


    useImperativeHandle(ref, () => ({
        rect: {
            y: rect.y,
            x: rect.y,
            width: rect.width,
            height: rect.height,
            scrollLeft,
            scrollTop
        },
        render,
        clear,
        reload,
    }));

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
                    ref={iframeRef}
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        border: 'none',
                    }} />
            </Box>
        </Box>
    );
});

CircleCanvas.displayName = "CircleCanvas";
export default CircleCanvas;
