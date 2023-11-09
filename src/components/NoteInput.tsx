import React, { useState, useRef, useEffect } from 'react';
import { useNotes, NoteInterface } from '../contexts/NotesContext';

const NoteInput: React.FC<{ note: NoteInterface, noteIndex: number, currentLevelNotes: NoteInterface[], currentLevelPath?: string }> = ({ note, noteIndex, currentLevelNotes, currentLevelPath="" }) => {
    const { addNote, updateNote, nestNote, findPreviousSiblingId } = useNotes();
    const noteId = note.id;
    const parentId = note.parentId;
    const previousNoteIndex = noteIndex - 1 >= 0 ? noteIndex - 1 : null;
    const previousNote = previousNoteIndex != null ? currentLevelNotes[previousNoteIndex] : null; 

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const target = e.target as HTMLInputElement;
        if (e.key === 'Enter') {
          e.preventDefault();
          // Add a new note and focus on its input field if the current note does not have an empty title
          if (target.value.trim() !== '') {
            const nextNote = currentLevelNotes[noteIndex+1] 
            const nextNoteEmpty = !nextNote?.title; 
            if(!nextNote || !nextNoteEmpty) {
              addNote("", noteIndex, parentId, currentLevelPath);
            }
          }
          // After state update, focus will shift to the new input automatically
          // due to the way React handles re-renders and the focus effect in this component
        }
        else if (e.key === 'Tab') {
          e.preventDefault(); // Stop the default tab action

          //Call the nestNote method is the note is not the first one.
          //Use the previous sibling as the new parent
          //...
          // Call the nestNote method from context if the note is not top-level
          if (previousNote) {
            nestNote(note, previousNote, noteIndex, previousNoteIndex, currentLevelPath);
          }
        }
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if(value.trim() !== note.title) {
          console.log("here");
          updateNote({...note, title: value}, noteIndex, currentLevelPath)
        }
    };

    return (
        <input
            ref={inputRef}
            type="text"
            className="border p-2"
            value={note.title}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
        />
    );

};

export default NoteInput;
