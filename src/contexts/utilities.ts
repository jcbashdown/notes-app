import { DBNoteInterface } from '../database/database';
import { NoteInterface } from './NotesContext';
export function insertByPath(path: string, obj: any, root: any): any {
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
export function removeNoteByPath(note: NoteInterface, path: string, root: any): any {
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
export function updateByPath(path: string, obj: any, root: any): any {

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
export function findByPath(path: string, root: any): NoteInterface | null {

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
