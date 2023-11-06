// NotesList.tsx
import React from 'react';
import { useNotes } from '../contexts/NotesContext';
import Note from './Note';

const NotesList: React.FC = () => {
  const { notes } = useNotes();
  return (
    <ul>
      {notes.map(note => (
        <Note key={note.id} noteId={note.id} />
      ))}
    </ul>
  );
};

export default NotesList;
