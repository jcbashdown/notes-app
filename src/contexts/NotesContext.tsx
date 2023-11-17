// NotesContext.tsx
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { db, addNote, updateNote, DBNoteInterface /* other methods */ } from '../database/database';

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

    useEffect(() => {
        // Initialize database and fetch initial notes
        const init = async () => {
            //const dbInstance = await db;
            //const initialNotes = await dbInstance.notes.find().exec();
            //setNotes(convertDBNotesToNoteInterfaces(initialNotes));
            //setLoading(false);
        };
        init();
    }, []);

    const addNote = (text: string, previousNoteIndex: number | null, parentId: string | null, currentLevelPath: string) => {
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
function findByPath(path: string, root: any): NoteInterface | null {

  // Split the path into parts
  const parts = path.split('.');

  //return if there are no parts
  if(parts.length === 0) return null;
  
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
    return parentArray[parseInt(lastIndex!)];
  }
  return null;
}

/*
 * Take a dot separated path like 1.children.2.children.1
 * Find the preceding element in the notes object which looks like this:
 * $notes: NoteInterface[] = [
 *    {
 *      id: "123xyz",
 *      text: "First Note",
 *      parentId: null,
 *      children: [
 *        {
 *          id: "321abc",
 *          text: "Child of First Note",
 *          parentId: "123xyz",
 *          children: []
 *        },
 *        {
 *          id: "434gts",
 *          text: "Second Child of First Note",
 *          parentId: "123xyz",
 *          children: [
 *            {
 *              id: "111ggg",
 *              text: "Final child of first note",
 *              parentId: "434gts",
 *              children: []
 *            }
 *          ]
 *        }
 *      ]
 *    },
 *    {
 *      id: "456def",
 *      text: "Second Note",
 *      parentId: null,
 *      children: [
 *        {
 *          id: "654fed",
 *          text: "Child of Second Note",
 *          parentId: "456def",
 *          children: []
 *        },
 *        {
 *          id: "789ghi",
 *          text: "Another Child of Second Note",
 *          parentId: "456def",
 *          children: []
 *        },
 *        {
 *          id: "123abc",
 *          text: "Here is the text!",
 *          parentId: "456def",
 *          children: [
 *            {
 *              id: "128abc",
 *              text: "Another text!",
 *              parentId: "123abc",
 *              children: []
 *            },
 *            {
 *              id: "126abc",
 *              text: "A text!",
 *              parentId: "123abc",
 *              children: []
 *            }
 *          ]
 *        }
 *      ]
 *    }
 * ]
 *
 * So for "1.children.2.children.1" we return:
 *   {
 *     id: "128abc"
 *     text: "Another text!",
 *     parentId: "123abc",
 *     children: []
 *   }
 * and for 1.children.2.children.0:
 *   {
 *     id: "123abc"
 *     text: "Here is the text!",
 *     parentId: "456def",
 *     children: []
 *   }
 * and more complicated "1" should return
 *   {
 *     id: "111ggg",
 *     text: "Final child of first note",
 *     parentId: "434gts",
 *     children: []
 *   }
 * i.e. the final child of "0" (not necessarily the deepest)
 *
 */
export const findPreviousNote = (currentNotePath: string, notes: NoteInterface[], currentNote: NoteInterface): NoteInterface | null => {
  let lastChildren = null;
  if(currentNotePath === "0") {
    return null
  } else if(currentNotePath.endsWith(".children.0")) {
    //If the currentNotePath ends in chilren.0 then remove it and call findPreviousNote again
    currentNotePath = currentNotePath.replace(/.children.0$/, "");
    return findByPath(currentNotePath, notes);
  } else { 
    //get the last part of the path
    const pathParts = currentNotePath.split(".");
    const lastPart = pathParts.pop();
    //if it's not an integer then return null
    if(!lastPart || isNaN(parseInt(lastPart))) return null;
    //put the path back together, now without the final part
    currentNotePath = pathParts.join(".");
    //subtract 1 from the last part
    let newLastPart = parseInt(lastPart) - 1;
    //currentNotePath is not an empty string then combine with the new last part
    //otherwise just use the new last part
    if(currentNotePath !== "") {
      currentNotePath = currentNotePath + "." + newLastPart;
    } else {
      currentNotePath = newLastPart.toString();
    }
    //find the note at the new note path
    const currentNote = findByPath(currentNotePath, notes);
    if(currentNote) {
      lastChildren = findLastTwoChildren(currentNote);
    }
  }

  if(lastChildren && lastChildren[0] && lastChildren[0].id !== currentNote.id) {
    return lastChildren[0];
  } else if(lastChildren && lastChildren[1]) {
    //if the last child is the same as the current note then return the previous note
    return lastChildren[1];
  }
  return null;
};

const findLastTwoChildren = (currentNote: NoteInterface, previousNote: NoteInterface | null = null): Array<NoteInterface | null> => {
  //find the last child of the current note
  const lastChild = currentNote.children[currentNote.children.length - 1];
  //if the last child has no children then return the last child
  if(!lastChild) {
    return [currentNote, previousNote];
  } else {
    return findLastTwoChildren(lastChild, currentNote);
  } 
}

export const convertDBNotesToNoteInterfaces = (dbNotes: DBNoteInterface[]): NoteInterface[] => {
  const notes: NoteInterface[] = [];
  const noteMap: { [key: string]: NoteInterface } = {};

  // First, create all notes and store them in a map for easy access
  dbNotes.forEach(dbNote => {
    noteMap[dbNote.id] = {
      id: dbNote.id,
      text: dbNote.text,
      parentId: dbNote.parentIds.length > 0 ? dbNote.parentIds[0] : null, // Assuming single parent
      children: []
    };
  });

  // Then, assign children to their respective parents
  dbNotes.forEach(dbNote => {
    if (dbNote.parentIds.length > 0) {
      const parentNote = noteMap[dbNote.parentIds[0]]; // Assuming single parent
      parentNote.children.push(noteMap[dbNote.id]);
    } else {
      // If there are no parents, it's a root note
      notes.push(noteMap[dbNote.id]);
    }
  });

  return notes;
};
