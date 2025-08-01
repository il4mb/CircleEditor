import Component from "./Component";

export default class Type implements Omit<TypeDefine, 'extend'> {

    type: string = "box";
    extend?: Type;
    model: ModelDefine;
    private _isComponent?: (el: HTMLElement) => boolean;

    constructor({ type, model, isComponent }: TypeDefine) {

        let _this = this;
        this._isComponent = isComponent || undefined;
        this.type = type;
        this.model = {
            ...model,
            init() {
                // invoke real
                model.init?.bind(this)();
                // invoke parent
                if (_this.extend?.model) {
                    _this.extend?.model.init?.bind({ ...this, model: _this.extend.model })();
                }
            },
        }
    }

    isComponent(el: HTMLElement): boolean {
        return this._isComponent?.(el) || false;
    }

    isType(component: Component): boolean {
        if (component.type == this.type) return true;
        if (this.extend) {
            return this.extend.isType(component);
        }
        return false;
    }


    _init(el: JQuery, component: Component) {
        const proxy: TypeProxy = {
            $el: el,
            component,
            model: this.model, // akan diganti setelah binding
            on(event, callback) {
                if (typeof callback != "function") return;
                const boundCallback = callback.bind(proxy);
                const key = `_proxy_cb_${event}_${callback.toString()}`;
                (callback as any)[key] = boundCallback;
                this.$el.on(event, boundCallback);
            },
            off(event, callback) {
                const key = `_proxy_cb_${event}_${callback.toString()}`;
                const bound = (callback as any)[key] ?? callback;
                this.$el.off(event, bound);
            },
        };

        // ⬇ Typed auto-bind
        proxy.model = this.bindModelMethods(this.model, proxy);

        this.model?.init?.bind(proxy)();
    }

    private bindModelMethods<T extends ModelDefine>(model: T, context: TypeProxy): T {
        const boundModel = { ...model };
        for (const key in model) {
            const val = model[key];
            if (typeof val === "function") {
                boundModel[key] = val.bind(context);
            }
        }
        return boundModel;
    }

}


export type TypeProxy = {
    $el: JQuery;
    component: Component;
    model: ModelDefine;
    on: (event: keyof HTMLElementEventMap, callback: (this: TypeProxy, e?: Event) => void) => void;
    off: (event: keyof HTMLElementEventMap, callback: (this: TypeProxy, e?: Event) => void) => void;
} & {
    [key: string]: any;
};


export type ModelDefine = {
    default: {
        tagName: string;
        attribute?: {};
        editable?: boolean;
        traits?: [];
    };
    init?: (this: TypeProxy) => void;
    [key: string]: ((this: TypeProxy, ...args: any[]) => void) | any;
};


export type TypeDefine = {
    type: string;
    isComponent?: (el: HTMLElement) => boolean;
    extend?: string;
    model: ModelDefine;
}