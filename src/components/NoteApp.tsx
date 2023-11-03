import React, { useState } from 'react';
import NoteInput from './NoteInput';

const NoteApp: React.FC = () => {
    const [notes, setNotes] = useState<string[]>([]);

    const addNote = (note: string) => {
        setNotes(prevNotes => [...prevNotes, note]);
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Note Taking App</h1>
            <NoteInput onAddNote={addNote} />
            <ul>
                {notes.map((note, index) => (
                    <li key={index} className="mt-2">{note}</li>
                ))}
            </ul>
        </div>
    );
}

export default NoteApp;
