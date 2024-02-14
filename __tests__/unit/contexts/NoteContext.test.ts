import { addNoteFn, nestNoteFn, deleteNoteFn, NoteInterface } from '../../../src/contexts/NotesContext';

jest.mock('../../../src/database/database', () => ({
  dbAddNote: jest.fn(),
  dbUpdateNote: jest.fn(),
  dbDeleteNoteById: jest.fn(),
}));

// Define a fixture that represents the initial state of notes
const initialNotes: NoteInterface[] = [
  {
    id: "123xyz",
    text: "First Note",
    parentId: null,
    children: [
      {
        id: "321abc",
        text: "Child of First Note",
        parentId: "123xyz",
        children: []
      },
      {
        id: "434gts",
        text: "Second Child of First Note",
        parentId: "123xyz",
        children: [
          {
            id: "111ggg",
            text: "Grandchild of First Note",
            parentId: "434gts",
            children: []
          }
        ]
      }
    ]
  }
];

describe('addNoteFn', () => {
  it('should add a note at the top level when no path is provided', () => {
    const newNote = {
      id: "555xyz",
      text: "New Top Level Note",
      parentId: null,
      children: []
    };
    const updatedNotes = addNoteFn({newNote, newNotes: JSON.parse(JSON.stringify(initialNotes)), previousNoteIndex: null, currentLevelPath: ''});
    expect(updatedNotes).toHaveLength(2); // Expecting now 2 top level notes
    expect(updatedNotes[1]).toEqual(newNote);
  });
  it("should add a new note at the end of the first note's second child's children array", () => {
    const newNote = {
      id: "333def",
      text: "New Sibling to Grandchild",
      parentId: "434gts",
      children: []
    };
    const updatedNotes = addNoteFn({newNote, newNotes: JSON.parse(JSON.stringify(initialNotes)), previousNoteIndex: null, currentLevelPath: '0.children.1.children'});
    expect(updatedNotes[0].children[1].children).toHaveLength(2); // Expecting now 2 children (siblings at grandchild level)
    expect(updatedNotes[0].children[1].children[1]).toEqual(newNote);
  });

  it("should add a new note at the start of the first note's second child's children array, pushing the existing note to second place", () => {
    const newNote = {
      id: "444ghi",
      text: "Deeply Nested New Note",
      parentId: "111ggg",
      children: []
    };
    // Adding as a new child to the grandchild
    const updatedNotes = addNoteFn({newNote, newNotes: JSON.parse(JSON.stringify(initialNotes)), previousNoteIndex: -1, currentLevelPath: '0.children.1.children'});
    expect(updatedNotes[0].children[1].children).toHaveLength(2); // Expecting the grandchild to now have 1 child
    expect(updatedNotes[0].children[1].children[0]).toEqual(newNote);
  });
});

describe('nestNoteFn', () => {
  it('should nest note in the expected place', () => {
    const newNote = {
        id: "434gts",
        text: "Second Child of First Note",
        parentId: "123xyz",
        children: [
          {
            id: "111ggg",
            text: "Grandchild of First Note",
            parentId: "434gts",
            children: []
          }
        ]
      }
    const newPreviousNote = {
        id: "321abc",
        text: "Child of First Note",
        parentId: "123xyz",
        children: []
      }
    const newNotes = JSON.parse(JSON.stringify(initialNotes))
    const updatedNotes = nestNoteFn({newNotes, newNote, newPreviousNote, noteIndex: 1, previousNoteIndex: 0, currentLevelPath: '0.children'});
    expect(updatedNotes[0].children).toHaveLength(1); // Expecting now 2 top level notes
    expect(updatedNotes[0].children[0].children).toEqual([newNote]);
  });
});
describe('deleteNoteFn', () => {
  it('should delete the note at the expected place', () => {
    const noteToDelete = {
      id: "321abc",
      text: "Child of First Note",
      parentId: "123xyz",
      children: []
    }
    const updatedNotes = deleteNoteFn({noteToDelete, noteIndex: 0, currentLevelPath: '0.children', newNotes: JSON.parse(JSON.stringify(initialNotes))});
    expect(updatedNotes[0].children).toHaveLength(1); // Expecting now 1 child
    expect(updatedNotes[0].children[0]).toEqual(initialNotes[0].children[1]);
  });
});
