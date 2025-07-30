import Component, { ComponentDefine } from "./Component";

export default class Type implements Omit<TypeDefine, 'extend'> {

    private _model: ModelDefine;

    type: string = "unknown";
    extend?: Type;
    model: ModelDefine;

    constructor({ type, model }: TypeDefine) {
        let _this = this;
        this.type = type;
        this._model = model;
        this.model = {
            ...model,
            init(el) {
                // invoke real
                model.init?.bind(this)(el);
                // invoke parent
                if (_this.extend?.model) {
                    _this.extend?.model.init?.bind({
                        model: _this.extend?.model,
                        component: this.component
                    })(el);
                }
            },
        }
    }
}

export type ModelDefine = {
    isInstance?: (el: HTMLElement) => boolean;
    default: {
        tagName: string;
        attribute?: {},
        editable?: boolean;
        traits?: []
    },
    init?: (this: { model: ModelDefine, component: Component }, el: JQuery|null) => void;
    [key: string]: any;
}

export type TypeDefine = {
    type: string;
    extend?: string;
    model: ModelDefine,
    view?: InstanceView;
}


class InstanceView {



}