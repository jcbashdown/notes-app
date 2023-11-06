import React from 'react';
import { useNotes } from '../contexts/NotesContext';
import NoteInput from './NoteInput';

const Note: React.FC<{ noteId: string }> = ({ noteId }) => {
  const { notes } = useNotes();
  const note = notes.find(n => n.id === noteId);

  if (!note) return null;

  return (
    <li>
      <NoteInput noteId={note.id} />
      {note.children && (
        <ul>
          {notes.filter(child => child.parentId === note.id).map(childNote => (
            <Note key={childNote.id} noteId={childNote.id} />
          ))}
        </ul>
      )}
    </li>
  );
};

export default Note;
