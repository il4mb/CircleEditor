import React from "react";
import { IRect } from "../type";

interface TextRectOverlayProps {
    rects: IRect[];
    color?: string;
    stroke?: string;
}

export const TextRectOverlay: React.FC<TextRectOverlayProps> = ({
    rects,
    color = "rgba(255, 230, 0, 0.05)",
    stroke = "orange",
}) => {
    if (rects.length === 0) return null;

    const start = rects[0];
    const end = rects[rects.length - 1];

    // const groupRectsByLine = (rects: IRect[]): IRect[][] => {
    //     const lines: IRect[][] = [];
    //     let currentLine: IRect[] = [];
    //     let lastY = rects[0]?.y ?? 0;
    //     const threshold = 2; // toleransi perbedaan y kecil

    //     for (const r of rects) {
    //         if (Math.abs(r.y - lastY) < threshold) {
    //             currentLine.push(r);
    //         } else {
    //             lines.push(currentLine);
    //             currentLine = [r];
    //             lastY = r.y;
    //         }
    //     }

    //     if (currentLine.length > 0) {
    //         lines.push(currentLine);
    //     }

    //     return lines;
    // };

    // const points = [
    //     `${first.x},${first.y}`, // top-left
    //     `${last.x + last.width},${last.y}`, // top-right
    //     `${last.x + last.width},${last.y + last.height}`, // bottom-right
    //     `${first.x},${first.y + first.height}`, // bottom-left
    // ].join(" ");

    // return (
    //     <svg
    //         style={{
    //             position: "absolute",
    //             left: 0,
    //             top: 0,
    //             width: "100%",
    //             height: "100%",
    //             pointerEvents: "none",
    //         }}
    //     >
    //         <polygon
    //             points={points}
    //             fill={color}
    //             stroke={stroke}
    //             strokeLinejoin="round"
    //         />
    //     </svg>
    // );
};
