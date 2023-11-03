import React, { useState, useEffect, useRef } from 'react';

interface NoteInputProps {
  onAddNote: (note: string) => void;
}

const NoteInput: React.FC<NoteInputProps> = ({ onAddNote }) => {
    const [value, setValue] = useState<string>("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && value.trim() !== '') {
            onAddNote(value);
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
