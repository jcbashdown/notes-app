// src/contexts/NotesContext.test.tsx

import { findPreviousNote, convertDBNotesToNoteInterfaces } from './utilities';
import { NoteInterface } from './NotesContext';
import { DBNoteInterface } from '../database/database';

const notesFixtures: NoteInterface[] = [
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
            text: "Final child of first note",
            parentId: "434gts",
            children: []
          }
        ]
      }
    ]
  },
  {
    id: "456def",
    text: "Second Note",
    parentId: null,
    children: [
      {
        id: "654fed",
        text: "Child of Second Note",
        parentId: "456def",
        children: []
      },
      {
        id: "789ghi",
        text: "Another Child of Second Note",
        parentId: "456def",
        children: []
      },
      {
        id: "123abc",
        text: "Here is the text!",
        parentId: "456def",
        children: [
          {
            id: "128abc",
            text: "Another text!",
            parentId: "123abc",
            children: []
          },
          {
            id: "126abc",
            text: "A text!",
            parentId: "123abc",
            children: []
          }
        ]
      }
    ]
  }
];
const dbNotesFixtures: DBNoteInterface[] = [
  {
    id: "123xyz",
    text: "First Note",
    parentIds: [],
    childIds: ["321abc", "434gts"]
  },
  {
    id: "321abc",
    text: "Child of First Note",
    parentIds: ["123xyz"],
    childIds: []
  },
  {
    id: "434gts",
    text: "Second Child of First Note",
    parentIds: ["123xyz"],
    childIds: ["111ggg"]
  },
  {
    id: "111ggg",
    text: "Final child of first note",
    parentIds: ["434gts"],
    childIds: []
  },
  {
    id: "456def",
    text: "Second Note",
    parentIds: [],
    childIds: ["654fed", "789ghi", "123abc"]
  },
  {
    id: "654fed",
    text: "Child of Second Note",
    parentIds: ["456def"],
    childIds: []
  },
  {
    id: "789ghi",
    text: "Another Child of Second Note",
    parentIds: ["456def"],
    childIds: []
  },
  {
    id: "123abc",
    text: "Here is the text!",
    parentIds: ["456def"],
    childIds: ["128abc", "126abc"]
  },
  {
    id: "128abc",
    text: "Another text!",
    parentIds: ["123abc"],
    childIds: []
  },
  {
    id: "126abc",
    text: "A text!",
    parentIds: ["123abc"],
    childIds: []
  }
];

describe('findPreviousNote', () => {
  it('should return the previous note to render which may be a note at a lower level', () => {
    const result = findPreviousNote("1", notesFixtures, notesFixtures[1]);
    expect(result).toEqual({
      id: "111ggg",
      text: "Final child of first note",
      parentId: "434gts",
      children: []
    });
  });

  it('should return the prior sibling at the same level', () => {
    const result = findPreviousNote("1.children.2.children.1", notesFixtures, notesFixtures[1]["children"][2]["children"][1]);
    expect(result).toEqual({
      id: "128abc",
      text: "Another text!",
      parentId: "123abc",
      children: []
    });
  });

  it('should return the parent node if index is 0 at final position (1.children.2.children.0)', () => {
    const result = findPreviousNote("1.children.2.children.0", notesFixtures, notesFixtures[1]["children"][2]["children"][0]);
    expect(result).toEqual({
      id: "123abc",
      text: "Here is the text!",
      parentId: "456def",
      children: [
          {
            id: "128abc",
            text: "Another text!",
            parentId: "123abc",
            children: []
          },
          {
            id: "126abc",
            text: "A text!",
            parentId: "123abc",
            children: []
          }
      ]
    });
  });
});
describe('convertDBNotesToNoteInterfaces', () => {
  it('should return the DB notes hydrated and nested as full notes', () => {
    const result = convertDBNotesToNoteInterfaces(dbNotesFixtures);
    expect(result).toEqual(notesFixtures);
  });
});
