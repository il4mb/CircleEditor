import { useRef, useEffect, useCallback, useState } from "react";

export function useDelay<A extends any[], R>(delay: number, action: (...args: A) => R, deps: any[] = []): (...args: A) => void {

    const timer = useRef<NodeJS.Timeout | null>(null);
    const savedAction = useRef(action);

    useEffect(() => {
        savedAction.current = action;
    }, [action, ...deps]);

    useEffect(() => {
        return () => {
            if (timer.current) {
                clearTimeout(timer.current);
            }
        };
    }, []);

    return useCallback((...args: A) => {

        if (timer.current) {
            clearTimeout(timer.current);
        }

        timer.current = setTimeout(() => {
            try {
                savedAction.current(...args);
                timer.current = null;
            } catch (err) {
                console.error(err);
            }
        }, delay);

    }, [delay]);
}



export default function useLocalStorage<T>(key: string, initialValue: T) {

    const [mounted, setMounted] = useState(false);
    const [value, setValue] = useState<T>(initialValue);

    useEffect(() => {
        if (!mounted) return;
        if (value == initialValue) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }
    }, [key, value, mounted]);

    useEffect(() => {
        setValue(() => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : initialValue;
            } catch (err) {
                console.error(err);
                return initialValue;
            } finally {
                setTimeout(() => setMounted(true), 0);
            }
        });
        return () => {
            setMounted(false);
        }
    }, [key]);

    return [value, setValue, mounted] as const;
}