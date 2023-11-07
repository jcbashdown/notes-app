// NotesList.tsx
import React from 'react';
import { useNotes, NoteInterface } from '../contexts/NotesContext';
import Note from './Note';

const NotesList: React.FC = () => {
  const { notes } = useNotes();
  return (
    <ul>
      {notes.map((note: NoteInterface, noteIndex: number) => {
        return <Note key={note.id} note={note} noteIndex={noteIndex} currentLevelNotes={notes}/>
      })}
    </ul>
  );
};

export default NotesList;
