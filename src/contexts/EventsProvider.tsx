import { createContext, useContext, useState, ReactNode } from 'react';

interface EventsProviderState {

}

const EventsProviderContext = createContext<EventsProviderState | undefined>(undefined);

type EventsProviderProps = {
    children?: ReactNode;
}
export const EventsProvider = ({ children }: EventsProviderProps) => {
    const [state, setstate] = useState<type>();

    return (
        <EventsProviderContext.Provider value={{ state, setstate }}>
            {children}
        </EventsProviderContext.Provider>
    );
};

export const useEventsProvider = () => {
    const context = useContext(EventsProviderContext);
    if (!context) throw new Error('useEventsProvider must be used within a EventsProviderProvider');
    return context;
};