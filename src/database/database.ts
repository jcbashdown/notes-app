import { createRxDatabase, RxDatabase, RxCollection } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { NoteInterface } from '../contexts/NotesContext';

export interface DBNoteInterface {
  id: string;
  text: string;
  parentIds: string[];
  childIds: string[];
}

// Schema as defined previously
const noteSchema = {
  title: 'note schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
    },
    text: {
      type: 'string',
    },
    parentIds: {
      type: ['array', 'null'],
      items: {
        type: 'string'
      }
    },
    childIds: {
      type: ['array', 'null'],
      items: {
        type: 'string'
      }
    }
  },
  required: ['text', 'id']
};

// Define TypeScript types for the database and collection
type NotesCollection = RxCollection<DBNoteInterface>;
export type NotesDatabase = RxDatabase<{ notes: NotesCollection }>;

// Initialize the database and add collections
async function initializeDB(): Promise<NotesDatabase> {

  const db: NotesDatabase = await createRxDatabase<NotesDatabase>({
    name: 'notesdb',
    multiInstance: true, //use the same db across tabs
    storage: getRxStorageDexie()
  });

  await db.addCollections({
    notes: {
      schema: noteSchema
    }
  });

  return db;
}

export async function dbAddNote(db: NotesDatabase, note: NoteInterface): Promise<void> {
  //Create an instance of DBNoteInterface from NoteInterface
  const dbNote = convertNoteInterfaceToDBNoteInterface(note);

  await db.notes.insert(dbNote);
}

export async function dbUpdateNote(db: NotesDatabase, noteId: string, updates: Partial<NoteInterface>): Promise<void> {
  //convert updates partial to dbNoteInterface partial
  const dbNoteUpdates = convertPartialNoteInterfaceToPartialDBNoteInterface(updates);
  await db.notes.upsert({ id: noteId, ...dbNoteUpdates });
}

//function to delete a note
export async function dbDeleteNoteById(db: NotesDatabase, noteId: string): Promise<void> {
  await db.notes.findOne(noteId).remove();
}

// Initialize and export the database
export const db = initializeDB();

//Utilities
const convertNoteInterfaceToDBNoteInterface = (note: NoteInterface): DBNoteInterface => {
  return {
    id: note.id,
    text: note.text,
    //TODO - multiple parents
    parentIds: note.parentId ? [note.parentId] : [],
    childIds: note.children.map(child => child.id),
  }
}
//convert Partial NoteInterface to Partial DBNoteInterface
const convertPartialNoteInterfaceToPartialDBNoteInterface = (note: Partial<NoteInterface>): Partial<DBNoteInterface> => {
  const dbNote: Partial<DBNoteInterface> = {};
  for (const key in note) {
    if (key === 'children') {
      dbNote.childIds = note.children?.map(child => child.id);
    } else if (key === 'parentId') {
      dbNote.parentIds = note.parentId ? [note.parentId] : [];
    } else if (key === 'id') {
      dbNote['id'] = note['id'];
    } else if (key === 'text') {
      dbNote['text'] = note['text'];
    }
  }
  return dbNote;
}
