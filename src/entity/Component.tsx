import { nanoid } from "nanoid";

// Core class representing a single DOM-like component node
export default class Component {

    id: string;
    type?: string;
    tagName: string;
    attributes: Record<string, string>;
    components: Component[];
    content: string;
    $el: JQuery<HTMLElement> | null = null;

    constructor({ type, tagName = 'div', attributes = {}, components = [], content = '' }: ComponentDefine) {
        this.id = nanoid();
        this.type = type;
        this.tagName = tagName;
        this.attributes = attributes;
        this.content = content;

        // Normalize and wrap sub-components
        this.components = components.map(c => {
            return c instanceof Component ? c : new Component(c);
        });
    }

    init(): void {
        // Placeholder for lifecycle logic, DOM hydration, etc.
        console.debug(`Component ${this.id} [${this.tagName}] initialized.`);
    }

    render(): JQuery<HTMLElement> {
        const $el = $(`<${this.tagName}>`, this.attributes);
        if (this.content) $el.html(this.content);

        // Recursively render children
        this.components.forEach(child => {
            $el.append(child.render());
        });

        this.$el = $el;
        return $el;
    }
}


export type ComponentDefine = {
    type?: string;
    tagName?: string;
    attributes?: {};
    components?: ComponentDefine[];
    content?: string;
}