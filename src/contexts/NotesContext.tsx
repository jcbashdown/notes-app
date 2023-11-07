// NotesContext.tsx
import React, { createContext, useContext, ReactNode, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface NoteInterface {
  id: string;
  title: string;
  parentId: string | null;
  children: NoteInterface[];
}

interface NotesContextType {
    notes: NoteInterface[];
    addNote: (title: string, parentId: string | null) => void;
    updateNote: (noteId: string, newTitle: string) => void;
    nestNote: (noteId: string, parentId: string) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

interface NotesProviderProps {
    children: ReactNode;
}

export const NotesProvider: React.FC<NotesProviderProps> = ({ children }) => {
    const [notes, setNotes] = useState<NoteInterface[]>([
      { id: uuidv4(), title: '', parentId: null, children: [] },
    ]);

    const addNote = (title: string, previousNoteIndex: number | null, parentId: string | null, currentLevelPath: string) => {
        const newNote: NoteInterface = {
            id: uuidv4(), // This will create a unique identifier
            title,
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

          return newNotes;
        });
    };

    const updateNote = (updatedNote: NoteInterface, noteIndex: number, currentLevelPath: string) => {
        if (currentLevelPath !== "") {
          currentLevelPath = currentLevelPath + ".";
        }
        setNotes(prevNotes => {
          const newNotes = JSON.parse(JSON.stringify(prevNotes));
          return updateByPath(`${currentLevelPath}${noteIndex}`, updatedNote, newNotes);
        });
    };

    const nestNote = (noteId: string, newParentId: string) => {
      setNotes(prevNotes => {
          const newNotes = JSON.parse(JSON.stringify(prevNotes));
          const noteIndex = newNotes.findIndex(note => note.id === noteId);
          const parentIndex = newNotes.findIndex(note => note.id === newParentId);

          if (noteIndex < 0 || parentIndex < 0) {
              return newNotes; // No changes if indices are not valid
          }

          // Remove note from its current position
          const [noteToNest] = newNotes.splice(noteIndex, 1);

          // Update its parentId
          noteToNest.parentId = newParentId;

          // Add note to the children array of the parent note
          const parentNote = newNotes[parentIndex];
          parentNote.children = [...parentNote.children, noteToNest];

          return newNotes;
      });
    };

    return (
        <NotesContext.Provider value={{ notes, addNote, updateNote, nestNote }}>
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

//Utils
function insertByPath(path: string, obj: any, root: any): any {
  // Split the path into parts
  const parts = path.split('.');

  //return if there are no parts
  if(parts.length === 0) return;
  
  // Find the index to insert at and remove it from the path
  const lastIndex = parts.pop();

  // Reduce the parts array to find the parent array
  const parentArray = parts.reduce((current: any, part: string) => {
    // If it's an attribute name, return the attribute
    if(isNaN(parseInt(part))) return current[part];
    // If it's an index, return the item at index
    return current[parseInt(part)];
  }, root);

  //return if the obj is already in the parent array
  if(parentArray.includes(obj)) return root;

  // If last index in path is "[]", push to the end of the array
  if(lastIndex === "[]") {
    parentArray.push(obj);
  } else if(!isNaN(parseInt(lastIndex!))) {
    parentArray.splice(parseInt(lastIndex!), 0, obj);
  }
  return root;
}
function updateByPath(path: string, obj: any, root: any): any {
  // Split the path into parts
  const parts = path.split('.');

  //return if there are no parts
  if(parts.length === 0) return;
  
  // Find the index to insert at and remove it from the path
  const lastIndex = parts.pop();

  // Reduce the parts array to find the parent array
  const parentArray = parts.reduce((current: any, part: string) => {
    // If it's an attribute name, return the attribute
    if(isNaN(parseInt(part))) return current[part];
    // If it's an index, return the item at index
    return current[parseInt(part)];
  }, root);

  if(!isNaN(parseInt(lastIndex!))) {
    parentArray[parseInt(lastIndex!)] = obj;
  }
  return root;
}
