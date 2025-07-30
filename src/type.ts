export interface IRect {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface ICanvasRect extends IRect {
    scrollTop: number;
    scrollLeft: number;
}