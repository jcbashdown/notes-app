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
    addNote: (title: string, previousNoteIndex: number | null, parentId: string | null, currentLevelPath: string) => void;
    updateNote: (updatedNote: NoteInterface, noteIndex: number, currentLevelPath: string) => void;
    deleteNote: (note: NoteInterface, noteIndex: number, currentLevelPath: string) => void;
    nestNote: (note: NoteInterface, previousNote: NoteInterface, noteIndex: number, previousNoteIndex: number | null, currentLevelPath: string) => void;
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
      console.log(currentLevelPath)
        if (currentLevelPath !== "") {
          currentLevelPath = currentLevelPath + ".";
        }
        setNotes(prevNotes => {
          const newNotes = JSON.parse(JSON.stringify(prevNotes));
          return updateByPath(`${currentLevelPath}${noteIndex}`, updatedNote, newNotes);
        });
    };

    const deleteNote = (note: NoteInterface, noteIndex: number, currentLevelPath: string) => {
      setNotes(prevNotes => {
          const newNotes = JSON.parse(JSON.stringify(prevNotes));
          const newNote = JSON.parse(JSON.stringify(note));

          // Remove note from its current position
          let pathWithArrayPosition = currentLevelPath;

          if (pathWithArrayPosition !== "") {
            pathWithArrayPosition = pathWithArrayPosition + ".";
          }

          return removeNoteByPath(newNote, `${pathWithArrayPosition}${noteIndex}`, newNotes);
      });
    }
    const nestNote = (note: NoteInterface, previousNote: NoteInterface, noteIndex: number, previousNoteIndex: number | null, currentLevelPath: string) => {
      setNotes(prevNotes => {
          const newNotes = JSON.parse(JSON.stringify(prevNotes));
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
          return updateByPath(`${pathWithArrayPosition}${previousNoteIndex}`, newPreviousNote, newNotes);
      });
    };

    return (
        <NotesContext.Provider value={{ notes, addNote, updateNote, deleteNote, nestNote }}>
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
function removeNoteByPath(note: NoteInterface, path: string, root: any): any {
  //log a deep copy of root
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

  //It must not do anything if it's run again
  if(parentArray[parseInt(lastIndex!)].id === note.id) {
    parentArray.splice(parseInt(lastIndex!), 1);
  }

  return root;
}
function updateByPath(path: string, obj: any, root: any): any {

  console.log(JSON.parse(JSON.stringify(root)));
  console.log(path);
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
  console.log(JSON.parse(JSON.stringify(root)));
  return root;
}
