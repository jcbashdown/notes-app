import React from 'react';
import { useNotes, NoteInterface } from '../contexts/NotesContext';
import NoteInput from './NoteInput';

const Note: React.FC<{ note: NoteInterface, noteIndex: number, currentLevelNotes: NoteInterface[], currentLevelPath?: string }> = ({ note, noteIndex, currentLevelNotes, currentLevelPath="" }) => {
  const nextPath = `${currentLevelPath}.${noteIndex}.children`;

  return (
    <li className="mb-2 border border-indigo-500 rounded p-2 lg:p-4 bg-gray-100 font-semibold">
      <NoteInput key={note.id} note={note} noteIndex={noteIndex} currentLevelNotes={currentLevelNotes} currentLevelPath={currentLevelPath} />
      {note.children && (
        <ul className="ml-4 font-normal">
          {note.children.map((childNote: NoteInterface, index: number) => {
            return <Note key={childNote.id} note={childNote} noteIndex={index} currentLevelNotes={note.children} currentLevelPath={nextPath} />
          })}
        </ul>
      )}
    </li>
  );
};

export default Note;
