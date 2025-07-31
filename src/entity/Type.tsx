import { CircleEditor } from "../CircleEditorProvider";
import Component from "./Component";

export default class Type implements Omit<TypeDefine, 'extend'> {

    type: string = "unknown";
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
                model.init?.();
                // invoke parent
                if (_this.extend?.model) {
                    _this.extend?.model.init?.();
                }
            },
        }
    }

    isComponent(el: HTMLElement): boolean {
        return this._isComponent?.(el) || false;
    }
    getEditor!: () => CircleEditor;

    render() {

    }
}

export type ModelDefine = {
    default: {
        tagName: string;
        attribute?: {},
        editable?: boolean;
        traits?: [];
    },
    init?: () => void;
    [key: string]: any;
}

export type TypeDefine = {
    type: string;
    isComponent?: (el: HTMLElement) => boolean;
    extend?: string;
    model: ModelDefine;
}