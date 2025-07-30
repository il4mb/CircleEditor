import { createContext, useContext, useState, ReactNode, useCallback, Dispatch, SetStateAction } from 'react';

export interface IDevice {
    name: string;
    maxWidth: number;
}

interface DevicesManagerState {
    devices: IDevice[];
    active: string;
    setActive: Dispatch<SetStateAction<string>>;
    addDevice: (device: IDevice) => void;
    removeDevice: (name: string) => void;
    updateDevice: (name: string, newDevice: Partial<IDevice>) => void;
    getDeviceByName: (name: string) => IDevice | undefined;
    setDevices: (devices: IDevice[]) => void;
    clearDevices: () => void;
    isLocked: (name: string) => boolean;
}

const DevicesManagerContext = createContext<DevicesManagerState | undefined>(undefined);

type DevicesManagerProps = {
    children?: ReactNode;
};

export const DevicesProvider = ({ children }: DevicesManagerProps) => {
    const DESKTOP_DEVICE_NAME = 'desktop';

    const defaultDevices: IDevice[] = [
        {
            name: DESKTOP_DEVICE_NAME,
            maxWidth: Infinity
        },
        {
            name: 'tablet',
            maxWidth: 800
        },
        {
            name: 'mobile',
            maxWidth: 400
        }
    ];

    const [devices, setDevicesState] = useState<IDevice[]>(defaultDevices);
    const [active, setActive] = useState(DESKTOP_DEVICE_NAME);

    const isLocked = (name: string) => name === DESKTOP_DEVICE_NAME || active == name;

    const addDevice = useCallback((device: IDevice) => {
        setDevicesState(prev => [...prev, device]);
    }, []);

    const removeDevice = useCallback((name: string) => {
        if (isLocked(name)) return;
        setDevicesState(prev => prev.filter(device => device.name !== name));
    }, []);

    const updateDevice = useCallback((name: string, newDevice: Partial<IDevice>) => {
        if (isLocked(name)) return;
        setDevicesState(prev =>
            prev.map(device =>
                device.name === name ? { ...device, ...newDevice } : device
            )
        );
    }, []);

    const getDeviceByName = useCallback((name: string) => {
        return devices.find(device => device.name === name);
    }, [devices]);

    const setDevices = useCallback((newDevices: IDevice[]) => {
        const lockedDevice = devices.find(d => isLocked(d.name));
        const filteredNew = newDevices.filter(d => !isLocked(d.name));
        setDevicesState([lockedDevice!, ...filteredNew]);
    }, [devices]);

    const clearDevices = useCallback(() => {
        const lockedDevice = devices.find(d => isLocked(d.name));
        setDevicesState(lockedDevice ? [lockedDevice] : []);
    }, [devices]);

    return (
        <DevicesManagerContext.Provider
            value={{
                active,
                devices,
                setActive,
                addDevice,
                removeDevice,
                updateDevice,
                getDeviceByName,
                setDevices,
                clearDevices,
                isLocked
            }}>
            {children}
        </DevicesManagerContext.Provider>
    );
};

export const useDevicesManager = (): DevicesManagerState => {
    const context = useContext(DevicesManagerContext);
    if (!context) {
        throw new Error('useDevicesManager must be used within a DevicesManager');
    }
    return context;
};
