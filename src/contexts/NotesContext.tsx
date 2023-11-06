// NotesContext.tsx
import React, { createContext, useContext, ReactNode, useState } from 'react';

interface Note {
  id: string;
  title: string;
  parentId: string | null;
  children: Note[];
}

interface NotesContextType {
    notes: Note[];
    addNote: (note: Note) => void;
    nestNote: (noteId: string, parentId: string) => void;
    findPreviousSiblingId: (noteId: string) => string | null;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

interface NotesProviderProps {
    children: ReactNode;
}

export const NotesProvider: React.FC<NotesProviderProps> = ({ children }) => {
    const [notes, setNotes] = useState<Note[]>([]);

    const addNote = (note: Note) => {
        setNotes(prevNotes => [...prevNotes, note]);
    };

    const nestNote = (noteId: string, newParentId: string) => {
      setNotes(prevNotes => {
        return prevNotes.map(note => {
          if (note.id === noteId) {
            return { ...note, parentId: newParentId };
          }
          return note;
        });
      });
    };

    const findPreviousSiblingId = (noteId: string): string | null => {
      const noteIndex = notes.findIndex(note => note.id === noteId);
      const currentNote = notes[noteIndex];
      if (noteIndex <= 0 || !currentNote) return null;
    
      // Traverse backwards to find the previous sibling with the same parentId
      for (let i = noteIndex - 1; i >= 0; i--) {
        if (notes[i].parentId === currentNote.parentId) {
          return notes[i].id;
        }
      }
    
      return null;
    };

    return (
        <NotesContext.Provider value={{ notes, addNote, nestNote, findPreviousSiblingId }}>
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
