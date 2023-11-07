// NotesContext.tsx
import React, { createContext, useContext, ReactNode, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Note {
  id: string;
  title: string;
  parentId: string | null;
  children: Note[];
}

interface NotesContextType {
    notes: Note[];
    addNote: (title: string, parentId: string | null) => void;
    updateNote: (noteId: string, newTitle: string) => void;
    nestNote: (noteId: string, parentId: string) => void;
    findPreviousSiblingId: (noteId: string) => string | null;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

interface NotesProviderProps {
    children: ReactNode;
}

export const NotesProvider: React.FC<NotesProviderProps> = ({ children }) => {
    const [notes, setNotes] = useState<Note[]>([
      { id: uuidv4(), title: '', parentId: null, children: [] },
    ]);

    const addNote = (title: string, previousNoteId: string | null = null, parentId?: string | null) => {
        const newNote: Note = {
            id: uuidv4(), // This will create a unique identifier
            title,
            parentId: parentId || null,
            children: []
        };
        setNotes(prevNotes => {
          const newNotes = [...prevNotes];
          
          // Find the index of the note after which the new note should be added
          const previousNoteIndex = previousNoteId != null ? newNotes.findIndex(n => n.id === previousNoteId) : -1;

          if (previousNoteIndex >= 0) {
            // Insert the new note after the specified note
            newNotes.splice(previousNoteIndex + 1, 0, newNote);
          } else {
            // If no specific position is given, add the new note to the end of the list
            newNotes.push(newNote);
          }

          return newNotes;
        });
    };

    const updateNote = (noteId: string, newTitle: string) => {
        setNotes(prevNotes => prevNotes.map(note => {
            if (note.id === noteId) {
                return { ...note, title: newTitle };
            }
            return note;
        }));
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
        <NotesContext.Provider value={{ notes, addNote, updateNote, nestNote, findPreviousSiblingId }}>
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
