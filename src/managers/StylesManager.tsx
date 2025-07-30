import { ReactNode } from 'react';

export interface StyleManagerProps {
    children?: ReactNode;
}
export default function StyleManager({ children }: StyleManagerProps) {
    return (
        <div>
            StyleManager Component
            {children}
        </div>
    );
}