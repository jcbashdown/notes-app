import React, { useState, useEffect, useRef } from 'react';
import { useNotes } from '../contexts/NotesContext';

const NoteInput: React.FC = () => {
    const [value, setValue] = useState<string>("");
    const inputRef = useRef<HTMLInputElement>(null);
    const { addNote } = useNotes();

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && value.trim() !== '') {
            addNote(value);
            setValue('');
        }
    };

    return (
        <input
            ref={inputRef}
            type="text"
            className="border p-2"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
        />
    );
}

export default NoteInput;
