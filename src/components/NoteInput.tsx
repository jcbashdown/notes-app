import React, { useState, useRef, useEffect } from 'react';
import { useNotes } from '../contexts/NotesContext';

const NoteInput: React.FC<{ noteId: string, parentId?: string }> = ({ noteId, parentId }) => {
    const { notes, addNote, updateNote, nestNote, findPreviousSiblingId } = useNotes();
    const note = notes.find(n => n.id === noteId);
    const [value, setValue] = useState(note?.title || "");

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        // This effect will update the value state whenever the current note's title changes
        if (note) {
            setValue(note.title);
        }
    }, [note]); // Depend on the note object itself, which will change when its title changes

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          // Add a new note and focus on its input field if the current note does not have an empty title
          if (value.trim() !== '') {
            addNote("", note?.id, parentId || null);
          }
          // After state update, focus will shift to the new input automatically
          // due to the way React handles re-renders and the focus effect in this component
        }
        else if (e.key === 'Tab') {
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

    // Update the note whenever the value changes
    useEffect(() => {
        // Only update if the value actually differs from the current note's title
        // to prevent unnecessary updates
        if(value !== note?.title) {
            updateNote(noteId, value);
        }
    }, [value, noteId, updateNote]);

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
