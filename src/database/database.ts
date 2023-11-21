import { createRxDatabase, RxDatabase, RxCollection, addRxPlugin, removeRxDatabase, RxError } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { replicateGraphQL, RxGraphQLReplicationState } from 'rxdb/plugins/replication-graphql';

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
      maxLength: 36
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
  const storage = getRxStorageDexie();
  // Dynamically import the RxDB development mode plugin in development environment
  if (process.env.NODE_ENV === 'development') {
    const devModePlugin = await import('rxdb/plugins/dev-mode');
    addRxPlugin(devModePlugin.RxDBDevModePlugin);
    // Remove the existing database (useful during development)
    //await removeRxDatabase('notesdb', storage);
  }
  const db: NotesDatabase = await createRxDatabase<NotesDatabase>({
    name: 'notesdb',
    multiInstance: true, //use the same db across tabs
    storage: storage
  });

  await db.addCollections({
    notes: {
      schema: noteSchema
    }
  });
  const replicationState: RxGraphQLReplicationState<DBNoteInterface, string> = replicateGraphQL({
      collection: db.notes,
      url: {
        http: 'http://localhost:3000/graphql'
      },
      //headers: {
          //'Authorization': 'Bearer your-token', // if required
      //},
      pull: {
          queryBuilder: pullQueryBuilder, // function returning the GraphQL query for pulling data
          responseModifier: pullResponseModifier,
          modifier: pulledDocModifier,    // function to modify pulled documents before they are stored
          dataPath: ['data', 'notes']
      },
      push: {
          queryBuilder: pushQueryBuilder, // function returning the GraphQL query for pushing data
      },
  });

    // You can also listen to replication events
  replicationState.error$.subscribe(err => {
      console.error('replication error', err);
  });

  return db;
}

// Define the query builders and modifiers
const pullQueryBuilder = (lastPulledRevision: string) => {
    const checkpoint = lastPulledRevision || new Date(0).toISOString(); // Start from the epoch if no lastPulledRevision
    return {
        query: `
            query {
                notes(checkpoint: "${checkpoint}") {
                    id
                    text
                    parents {
                        id
                        text
                    }
                    children {
                        id
                        text
                    }
                }
            }
        `,
        variables: {}
    };
};

const pullResponseModifier = (response: any) => {
  return {
    documents: response
  }
}

const pushQueryBuilder = (doc: any) => {
    // Return the GraphQL mutation for pushing data
};

const pulledDocModifier = (doc: any) => {
  console.log(doc)
  console.log("pulledDocModifier")
    // Assuming the server returns the data in the format required by your local DB schema
    // You may need to transform the data here if the formats are different
    return {
        id: doc.id,
        text: doc.text,
        parentIds: doc.parents.map((parent: any) => parent.id),
        childIds: doc.children.map((child: any) => child.id)
    };
};

export async function dbAddNote(db: NotesDatabase, note: NoteInterface): Promise<void> {
  //Create an instance of DBNoteInterface from NoteInterface
  const dbNote = convertNoteInterfaceToDBNoteInterface(note);

  try {
    const existingNote = await db.notes.findOne(dbNote.id);
    if(!existingNote) {
      await db.notes.insert(dbNote);
    } else {
      console.error('Note with the same ID already exists. In react strict dev mode code may be called twice to deter side effects. If this is happening in production then there may be a bug', existingNote);
    }
  } catch (error: any) {
    if (error.status === 409) {
      console.error('Conflict detected. Note with the same ID already exists.', error);
      // Handle conflict (e.g., merge changes, notify user, etc.)
    } else {
      // Handle other errors
      throw error;
    }
  }
}

export async function dbUpdateNote(db: NotesDatabase, noteId: string, updates: Partial<NoteInterface>): Promise<void> {
  //convert updates partial to dbNoteInterface partial
  const dbNoteUpdates = convertPartialNoteInterfaceToPartialDBNoteInterface(updates);
  await db.notes.upsert({ id: noteId, ...dbNoteUpdates });
}

//function to delete a note
export async function dbDeleteNoteById(db: NotesDatabase, noteId: string): Promise<void> {
  try {
    const existingNote = await db.notes.findOne(noteId);
    if(existingNote) {
      await db.notes.findOne(noteId).remove();
    } else {
      console.error("A note with the ID doesn't exists. In react strict dev mode code may be called twice to deter side effects so the note may already have been deleted. If this is happening in production then there may be a bug', existingNote");
    }
  } catch (error: any) {
    if (error.status === 409) {
      console.error('Conflict detected. Note with the same ID may have already been deleted.', error);
      // Handle conflict (e.g., merge changes, notify user, etc.)
    } else {
      // Handle other errors
      throw error;
    }
  }
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
