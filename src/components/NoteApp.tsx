import React from 'react';
import NotesList from './NotesList';
import { NotesProvider, useNotes } from '../contexts/NotesContext';


const NoteApp: React.FC = () => {
    return (
        <NotesProvider>
            <div className="flex justify-between items-center p-4 bg-indigo-600 text-white">
                <h1 className="text-2xl font-semibold">My Notes App</h1>
                <button className="bg-green-500 hover:bg-green-700 px-4 py-2 rounded">Add Note</button>
            </div>
            <NotesList />
        </NotesProvider>
    );
}

export default NoteApp;
