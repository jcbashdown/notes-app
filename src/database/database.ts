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
interface DBNotePushRow {
    assumedMasterState: DBNoteInterface | undefined;
    newDocumentState: DBNoteInterface | undefined;
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
        http: 'http://localhost:3000/graphql',
        //ws: 'ws://localhost:3000/cable' // <- The websocket has to use a different url.
      },
      //headers: {
          //'Authorization': 'Bearer your-token', // if required
      //},
      pull: {
          queryBuilder: pullQueryBuilder, // function returning the GraphQL query for pulling data

          //streamQueryBuilder: pullStreamQueryBuilder,
          //responseModifier: pullResponseModifier,
          modifier: pulledDocModifier,    // function to modify pulled documents before they are stored
          dataPath: ['data', 'notesQuery', 'syncedNotes']
      },
      push: {
          queryBuilder: pushQueryBuilder, // function returning the GraphQL query for pushing data
          responseModifier: async function (plainResponse) {
            return plainResponse.conflicts;
          },
      },
  });

    // You can also listen to replication events
  replicationState.error$.subscribe(err => {
      console.error('replication error', err);
  });

  return db;
}

// Define the query builders and modifiers
// TODO - adjust this to actually use variables
const pullQueryBuilder = (lastPulledRevision: any) => {
    const checkpoint = lastPulledRevision || {updatedAt: new Date(0).toISOString()}; // Start from the epoch if no lastPulledRevision
    return {
        query: `
          query { notesQuery {
            syncedNotes(checkpoint: {updatedAt:"${checkpoint.updatedAt}"}) {
              documents {
                id
                text
                children {
                  id
                }
                parents {
                  id
                }
              }
              checkpoint {
                updatedAt
              }
            }
          }}
        `,
        variables: {
          checkpoint: checkpoint
        }
    };
};
const pullStreamQueryBuilder = (lastPulledRevision: any) => {
    const checkpoint = lastPulledRevision || {updatedAt: new Date(0).toISOString()}; // Start from the epoch if no lastPulledRevision
    const query = `
      subscription noteChanged {
        noteChanged { 
          noteChanges(checkpoint: {updatedAt: "${checkpoint.updatedAt}"}) {
            documents {
              id
              text
              childIds
              parentIds
              _deleted
            }
            checkpoint {
              updatedAt
            }
          }
        }
      }
    `
    return {
        query,
        variables: {
          checkpoint: checkpoint
        }
    };
};

const pushQueryBuilder = (docs: DBNotePushRow[]) => {
  // GraphQL mutation template
  const mutation = `
    mutation SyncNotes($changes: [NoteChangeInput!]!) {
      syncNotes(changes: $changes) {
        conflicts {
          id
          text
          parentIds
          childIds
        }
      }
    }
  `;

  return {
    query: mutation,
    variables: {
      changes: docs
    }
  };
};

const pulledDocModifier = (doc: any) => {
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
    const existingNote = await db.notes.findOne(dbNote.id).exec();
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
if (process.env.NODE_ENV === 'development') {
  db.then(database => {
     window.myNotesDb = database;
  });
}

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

//EXTRACT THIS OUT ONCE IT WORKS

import { ApolloClient, HttpLink, ApolloLink, InMemoryCache } from '@apollo/client';
//TODO remove rails 5 actioncable dependency. Just use @rails/actioncable 
import { createConsumer } from '@rails/actioncable';
import ActionCableLink from 'graphql-ruby-client/subscriptions/ActionCableLink';

const cable = createConsumer('ws://localhost:3000/cable');

const wsLink = new ActionCableLink({ cable });

const client = new ApolloClient({
  link: wsLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
    },
    query: {
      fetchPolicy: 'no-cache',
    },
    mutate: {
      fetchPolicy: 'no-cache',
    },
  },
});

import gql from 'graphql-tag';

const NoteChanged = gql`
subscription NoteChanged {
  noteChanged { 
    noteChanges(checkpoint: {updatedAt: "023-11-10T11:53:36+00:00"}) {
      documents {
        id
        text
        childIds
        parentIds
        _deleted
      }
      checkpoint {
        updatedAt
      }
    }
  }
}
`;
//import { useSubscription } from "@apollo/client";
// @ts-ignore
//import { NoteChanged } from "../queries/note_changed.gql";
//useSubscription(NoteChanged);
client.subscribe({
  query: NoteChanged,
  variables: {}
}).subscribe({
  next(response) {
    console.log(response);
    if(response.data.noteChanged) {
      const updatedNote = response.data.noteChanged.noteChanges.documents;
      //TODO - move into the initialise
      //if it's a delete then delete it
      if(updatedNote._deleted) {
        dbDeleteNoteById(window.myNotesDb, updatedNote.id);
      } else {
        dbUpdateNote(window.myNotesDb, updatedNote.id, updatedNote);
      }
    }

  },
  error(err) { console.error('Error in subscription', err); },
});
