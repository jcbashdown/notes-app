import React, { useRef, useEffect } from 'react';
import { useNotes, NoteInterface } from '../contexts/NotesContext';

const NoteInput: React.FC<{ note: NoteInterface, noteIndex: number, currentLevelNotes: NoteInterface[], currentLevelPath?: string }> = ({ note, noteIndex, currentLevelNotes, currentLevelPath="" }) => {
    const { addNote, updateNote, deleteNote, nestNote, findPrecedingNote } = useNotes();
    const parentId = note.parentId;
    const previousNoteIndex = noteIndex - 1 >= 0 ? noteIndex - 1 : null;
    const previousNote = previousNoteIndex != null ? currentLevelNotes[previousNoteIndex] : null; 
    const currentNotePath = currentLevelPath ? `${currentLevelPath}.${noteIndex}` : `${noteIndex}`;

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const target = e.target as HTMLInputElement;
      console.log(e.key);
        if (e.key === 'Enter') {
          e.preventDefault();
          // Add a new note and focus on its input field if the current note does not have an empty text
          if (target.value.trim() !== '') {
            const nextNote = currentLevelNotes[noteIndex+1] 
            const nextNoteEmpty = !nextNote?.text; 
            if(!nextNote || !nextNoteEmpty) {
              addNote("", noteIndex, parentId, currentLevelPath);
            }
          }
          // After state update, focus will shift to the new input automatically
          // due to the way React handles re-renders and the focus effect in this component
        }
        else if (e.key === 'Tab') {
          e.preventDefault(); // Stop the default tab action

          if (target.value.trim() !== '' && previousNote) {
            nestNote(note, previousNote, noteIndex, previousNoteIndex, currentLevelPath);
          }
        }
        else if (e.key === 'Backspace') {

          if (target.value.trim() === '' && currentNotePath !== '0') {
            e.preventDefault();

            //focus on the preceding note index which has precedingNote.id as
            //it's data-note-id
            const precedingNote = findPrecedingNote(currentNotePath, note)
            if(precedingNote) {
              const precedingNoteInput = document.querySelector(`[data-note-id="${precedingNote.id}"]`) as HTMLInputElement;
              if(precedingNoteInput) {
                precedingNoteInput.focus();
              }
            }
            deleteNote(note, noteIndex, currentLevelPath);
          }
        }
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
      console.log("change");
      console.log(note);
        if(value.trim() !== note.text && (note.text !== '' || value.trim() !== '')) {
          updateNote({...note, text: value}, noteIndex, currentLevelPath)
        }
    };

    return (
        <input
            ref={inputRef}
            data-note-id={note.id} 
            type="text"
            className="border p-2"
            value={note.text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
        />
    );

};

export default NoteInput;
