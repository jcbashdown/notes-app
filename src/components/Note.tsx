import React from 'react';
import { useNotes, NoteInterface } from '../contexts/NotesContext';
import NoteInput from './NoteInput';

const Note: React.FC<{ note: NoteInterface, noteIndex: number, currentLevelNotes: NoteInterface[], currentLevelPath?: string }> = ({ note, noteIndex, currentLevelNotes, currentLevelPath="" }) => {
  const nextPath = `${currentLevelPath}.${noteIndex}.children`;

  return (
    <li>
      <NoteInput key={note.id} note={note} noteIndex={noteIndex} currentLevelNotes={currentLevelNotes} currentLevelPath={currentLevelPath} />
      {note.children && (
        <ul>
          {note.children.map((childNote: NoteInterface, index: number) => {
            return <Note key={childNote.id} note={childNote} noteIndex={index} currentLevelNotes={note.children} currentLevelPath={nextPath} />
          })}
        </ul>
      )}
    </li>
  );
};

export default Note;
