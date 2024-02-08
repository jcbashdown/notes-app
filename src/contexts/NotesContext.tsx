// NotesContext.tsx
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { debounce } from 'lodash';

import { NotesDatabase, db, dbAddNote, dbUpdateNote, dbDeleteNoteById } from '../database/database';
//Utils
import {insertByPath, removeNoteByPath, updateByPath, findPreviousNote, convertDBNotesToNoteInterfaces} from './utilities';

export interface NoteInterface {
  id: string;
  text: string;
  parentId: string | null;
  children: NoteInterface[];
}

interface NotesContextType {
    notes: NoteInterface[];
    addNote: (text: string, previousNoteIndex: number | null, parentId: string | null, currentLevelPath: string) => void;
    updateNote: (updatedNote: NoteInterface, noteIndex: number, currentLevelPath: string) => void;
    deleteNote: (note: NoteInterface, noteIndex: number, currentLevelPath: string) => void;
    nestNote: (note: NoteInterface, previousNote: NoteInterface, noteIndex: number, previousNoteIndex: number | null, currentLevelPath: string) => void;
    findPrecedingNote: (currentNotePath: string, currentNote: NoteInterface) => NoteInterface | null;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

interface NotesProviderProps {
    children: ReactNode;
}

export const NotesProvider: React.FC<NotesProviderProps> = ({ children }) => {
    const [notes, setNotes] = useState<NoteInterface[]>([]);

    const [loading, setLoading] = useState(true); // New state for loading

    const [dbInstance, setDbInstance] = useState<NotesDatabase | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const dbInstance = await db;
                setDbInstance(dbInstance);
                const initialNotes = await dbInstance.notes.find().exec();
                //if there are no initial notes then add an empty one
                if(initialNotes.length === 0) {
                  await dbAddNote(dbInstance, { id: uuidv4(), text: '', parentId: null, children: [] });
                }
                setNotes(convertDBNotesToNoteInterfaces(initialNotes));
            } catch (error) {
                console.error("Error initializing notes:", error);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    const addNote = (text: string, previousNoteIndex: number | null, parentId: string | null, currentLevelPath: string) => {
        if (!dbInstance) return; // Ensure dbInstance is available
        const newNote: NoteInterface = {
            id: uuidv4(), // This will create a unique identifier
            text,
            parentId: parentId,
            children: []
        };
        //if the currentLevelPath is not empty then add "." to the end of the path
        setNotes(prevNotes => {
          const newNotes = JSON.parse(JSON.stringify(prevNotes));
          
          // Add the note at the correct location
          // This is specified by a dot separated path provided by currentLevelPath plus the previousNoteIndex
          // If previousNoteIndex is null, the new note will be added to the end of the list
          let pathWithArrayPosition = currentLevelPath;

          if (pathWithArrayPosition !== "") {
            pathWithArrayPosition = pathWithArrayPosition + ".";
          }
          if (previousNoteIndex !== null) {
            //create the full path by combining pathWithArrayPosition and previousNoteIndex
            pathWithArrayPosition = pathWithArrayPosition + (previousNoteIndex + 1);
            //use insertByPath to insert the new note at the correct location
            insertByPath(pathWithArrayPosition, newNote, newNotes);
          } else {
            // If no specific position is given, add the new note to the end of the list
            insertByPath(pathWithArrayPosition+"[]", newNote, newNotes);
          }
          debounce(dbAddNote, 1000)(dbInstance, newNote);
          return newNotes;
        });
    };

    const updateNote = (updatedNote: NoteInterface, noteIndex: number, currentLevelPath: string) => {
        if (!dbInstance) return; // Ensure dbInstance is available
        if (currentLevelPath !== "") {
          currentLevelPath = currentLevelPath + ".";
        }
        setNotes(prevNotes => {
          let newNotes = JSON.parse(JSON.stringify(prevNotes));
          newNotes = updateByPath(`${currentLevelPath}${noteIndex}`, updatedNote, newNotes);
          debounce(dbUpdateNote, 1000)(dbInstance, updatedNote.id, updatedNote);
          return newNotes;
        });
        
    };

    const deleteNote = (note: NoteInterface, noteIndex: number, currentLevelPath: string) => {
      if (!dbInstance) return; // Ensure dbInstance is available
      setNotes(prevNotes => {
          let newNotes = JSON.parse(JSON.stringify(prevNotes));
          const newNote = JSON.parse(JSON.stringify(note));

          // Remove note from its current position
          let pathWithArrayPosition = currentLevelPath;

          if (pathWithArrayPosition !== "") {
            pathWithArrayPosition = pathWithArrayPosition + ".";
          }

          newNotes = removeNoteByPath(newNote, `${pathWithArrayPosition}${noteIndex}`, newNotes);
          debounce(dbDeleteNoteById, 1000)(dbInstance, newNote.id);
          return newNotes;

      });
    }
    const nestNote = (note: NoteInterface, previousNote: NoteInterface, noteIndex: number, previousNoteIndex: number | null, currentLevelPath: string) => {
      if (!dbInstance) return; // Ensure dbInstance is available
      setNotes(prevNotes => {
          let newNotes = JSON.parse(JSON.stringify(prevNotes));
          const newNote = JSON.parse(JSON.stringify(note));
          const newPreviousNote = JSON.parse(JSON.stringify(previousNote));

          if (noteIndex < 0 || previousNoteIndex === null || previousNoteIndex < 0) {
              return newNotes; // No changes if indices are not valid
          }

          // Remove note from its current position
          let pathWithArrayPosition = currentLevelPath;

          if (pathWithArrayPosition !== "") {
            pathWithArrayPosition = pathWithArrayPosition + ".";
          }

          removeNoteByPath(newNote, `${pathWithArrayPosition}${noteIndex}`, newNotes);

          // Update its parentId
          newNote.parentId = previousNote.id;
          // Add to parents children 
          newPreviousNote.children = [...previousNote.children, newNote];

          //update in the notes itself
          newNotes = updateByPath(`${pathWithArrayPosition}${previousNoteIndex}`, newPreviousNote, newNotes);
          //update in the database
          //debounce the next two function calls
          debounce(function (dbInstance, newPreviousNote, newNote) {
            dbUpdateNote(dbInstance, newPreviousNote.id, newPreviousNote);
            dbUpdateNote(dbInstance, newNote.id, newNote);
          }, 1000)(dbInstance, newPreviousNote, newNote);
          return newNotes;
      });
    };
    const findPrecedingNote = (currentNotePath: string, currentNote: NoteInterface): NoteInterface | null => {
      return findPreviousNote(currentNotePath, notes, currentNote);
    }

    return (
        <NotesContext.Provider value={{ notes, addNote, updateNote, deleteNote, nestNote, findPrecedingNote }}>
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

