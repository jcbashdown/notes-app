import React from 'react';
import NoteInput from './NoteInput';
import { NotesProvider, useNotes } from '../contexts/NotesContext';

const NotesList: React.FC = () => {
    const { notes } = useNotes();
    return (
        <ul>
            {notes.map((note, index) => (
                <li key={index} className="mt-2">{note}</li>
            ))}
        </ul>
    );
}

const NoteApp: React.FC = () => {
    return (
        <NotesProvider>
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">Note Taking App</h1>
                <NoteInput />
                <NotesList />
            </div>
        </NotesProvider>
    );
}

export default NoteApp;
