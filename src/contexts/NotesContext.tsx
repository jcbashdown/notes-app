// NotesContext.tsx
import React, { createContext, useContext, ReactNode, useState } from 'react';

interface NotesContextType {
    notes: string[];
    addNote: (note: string) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

interface NotesProviderProps {
    children: ReactNode;
}

export const NotesProvider: React.FC<NotesProviderProps> = ({ children }) => {
    const [notes, setNotes] = useState<string[]>([]);

    const addNote = (note: string) => {
        setNotes(prevNotes => [...prevNotes, note]);
    };

    return (
        <NotesContext.Provider value={{ notes, addNote }}>
            {children}
        </NotesContext.Provider>
    );
}

export const useNotes = () => {
    const context = useContext(NotesContext);
    if (!context) {
        throw new Error('useNotes must be used within a NotesProvider');
    }
    return context;
}
