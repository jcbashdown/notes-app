import { createRxDatabase, RxDatabase, RxCollection, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { NoteInterface } from '../contexts/NotesContext';

//Maybe not needed - can we have recursive types like this with rxdb or do we
//need to just get ids?
// Define a TypeScript interface for your note
//export interface NoteInterface {
  //id: string;
  //text: string;
  //parentId: string | null;
  //children: NoteInterface[];
//}

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
    parentId: {
      type: ['string', 'null'],
    },
    children: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          // Define properties for children if necessary
        }
      }
    }
  },
  required: ['text', 'id']
};

// Define TypeScript types for the database and collection
type NotesCollection = RxCollection<NoteInterface>;
type NotesDatabase = RxDatabase<{ notes: NotesCollection }>;

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

// Example function to add a note
export async function addNote(db: NotesDatabase, note: NoteInterface): Promise<void> {
  await db.notes.insert(note);
}

// Example function to update a note
export async function updateNote(db: NotesDatabase, noteId: string, updates: Partial<NoteInterface>): Promise<void> {
  await db.notes.upsert({ id: noteId, ...updates });
}

// Initialize and export the database
export const db = initializeDB();
