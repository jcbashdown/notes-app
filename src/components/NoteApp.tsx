import React from 'react';
import NotesList from './NotesList';
import { NotesProvider, useNotes } from '../contexts/NotesContext';


const NoteApp: React.FC = () => {
    return (
        <NotesProvider>
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">Note Taking App</h1>
                <NotesList />
            </div>
        </NotesProvider>
    );
}

export default NoteApp;
