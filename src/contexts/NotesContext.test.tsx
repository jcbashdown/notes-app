// src/contexts/NotesContext.test.tsx

import { findPreviousNote, NoteInterface } from '../contexts/NotesContext'; // Update with the correct import based on your project structure

// Define the notes structure as provided in the task description
const notesFixtures: NoteInterface[] = [
  {
    id: "123xyz",
    title: "First Note",
    parentId: null,
    children: [
      {
        id: "321abc",
        title: "Child of First Note",
        parentId: "123xyz",
        children: []
      },
      {
        id: "434gts",
        title: "Second Child of First Note",
        parentId: "123xyz",
        children: [
          {
            id: "111ggg",
            title: "Final child of first note",
            parentId: "434gts",
            children: []
          }
        ]
      }
    ]
  },
  {
    id: "456def",
    title: "Second Note",
    parentId: null,
    children: [
      {
        id: "654fed",
        title: "Child of Second Note",
        parentId: "456def",
        children: []
      },
      {
        id: "789ghi",
        title: "Another Child of Second Note",
        parentId: "456def",
        children: []
      },
      {
        id: "123abc",
        title: "Here is the title!",
        parentId: "456def",
        children: [
          {
            id: "128abc",
            title: "Another Title!",
            parentId: "123abc",
            children: []
          },
          {
            id: "126abc",
            title: "A Title!",
            parentId: "123abc",
            children: []
          }
        ]
      }
    ]
  }
];

describe('findPreviousNote', () => {
  it('should return the previous note to render which may be a note at a lower level', () => {
    const result = findPreviousNote("1", notesFixtures, notesFixtures[1]);
    expect(result).toEqual({
      id: "111ggg",
      title: "Final child of first note",
      parentId: "434gts",
      children: []
    });
  });

  it('should return the prior sibling at the same level', () => {
    const result = findPreviousNote("1.children.2.children.1", notesFixtures, notesFixtures[1]["children"][2]["children"][1]);
    expect(result).toEqual({
      id: "128abc",
      title: "Another Title!",
      parentId: "123abc",
      children: []
    });
  });

  it('should return the parent node if index is 0 at final position (1.children.2.children.0)', () => {
    const result = findPreviousNote("1.children.2.children.0", notesFixtures, notesFixtures[1]["children"][2]["children"][0]);
    expect(result).toEqual({
      id: "123abc",
      title: "Here is the title!",
      parentId: "456def",
      children: [
          {
            id: "128abc",
            title: "Another Title!",
            parentId: "123abc",
            children: []
          },
          {
            id: "126abc",
            title: "A Title!",
            parentId: "123abc",
            children: []
          }
      ]
    });
  });
});
