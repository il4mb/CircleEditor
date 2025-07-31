type Component = {
    id?: string;
    type?: string;
    tagName?: string;
    attributes?: {};
    components?: Component[];
    content?: string;
}

export default Component;