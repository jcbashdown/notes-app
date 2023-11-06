import React, { useState, useRef, useEffect } from 'react';
import { useNotes } from '../contexts/NotesContext';

const NoteInput: React.FC<{ noteId?: string, parentId?: string, onAdd?: () => void }> = ({ parentId, onAdd }) => {
    const [value, setValue] = useState("");
    const { addNote, nestNote } = useNotes();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (value.trim() !== '') {
                addNote(value, parentId);
                setValue('');
                onAdd?.();
            }
        } else if (e.key === 'Tab') {
          e.preventDefault(); // Stop the default tab action

          // Call the nestNote method from context if the note is not top-level
          if (parentId) {
            // Assume we have a function `findPreviousSiblingId` that finds the previous sibling note's ID
            const previousSiblingId = findPreviousSiblingId(noteId);
            if (previousSiblingId) {
              nestNote(noteId, previousSiblingId);
            }
          }
        }
    };

    return (
        <input
            ref={inputRef}
            type="text"
            className="border p-2"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
        />
    );

};

export default NoteInput;
