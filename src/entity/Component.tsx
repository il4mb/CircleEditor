import { nanoid } from "nanoid";


export default class Component implements ComponentDefine {

    id: string;
    type?: string;
    tagName: string;
    attributes: {};
    components: Component[];
    content?: string;
    $el: JQuery | null = null;

    constructor({ type, tagName, attributes, components, content }: ComponentDefine) {

        this.id = nanoid();
        this.type = type;
        this.tagName = tagName || 'div';
        this.attributes = attributes || {};
        this.components = (components || []).map<Component>((define: any) => {
            if (!(define as any).id) return new Component(define);
            return define;
        });
        this.content = content || '';
    }
}

export type ComponentDefine = {
    type?: string;
    tagName?: string;
    attributes?: {};
    components?: ComponentDefine[];
    content?: string;
}