export default interface Component {
    id: string;
    type?: string;
    tagName?: string;
    attributes?: {};
    components?: Component[];
    content?: string;
}

export type IComponent = Omit<Component, 'id' | 'components'> & {
    id?: string;
    components?: IComponent[];
}