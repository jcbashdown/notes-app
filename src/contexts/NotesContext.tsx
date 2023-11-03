import React, { createContext, useReducer, useContext } from 'react';

// Define the type for the state
type Note = {
  id: number;
  title: string;
  children?: Note[];
};

type NotesState = {
  notes: Note[];
};

// Define the type for the actions
type ActionType = 
  | { type: 'ADD_NOTE'; payload: string }
  | { type: 'ADD_CHILD_NOTE'; payload: { id: number; title: string } }
  // ... You can extend this with other action types as needed

// Initial state
const initialState: NotesState = {
  notes: []
};

// Create the context
const NotesContext = createContext<{ state: NotesState; dispatch: React.Dispatch<ActionType> } | undefined>(undefined);

// Reducer function
const notesReducer = (state: NotesState, action: ActionType): NotesState => {
  switch (action.type) {
    case 'ADD_NOTE':
      // Logic to add a note
      return {
        ...state,
        notes: [...state.notes, { id: Date.now(), title: action.payload }]
      };
    case 'ADD_CHILD_NOTE':
      // Logic to add a child note (This will be a bit more complex as you'd need to locate the parent note first)
      return state;
    default:
      return state;
  }
};

// Provider component
const NotesProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(notesReducer, initialState);

  return (
    <NotesContext.Provider value={{ state, dispatch }}>
      {children}
    </NotesContext.Provider>
  );
};

// Custom hook to use the Notes context
const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

export { NotesProvider, useNotes };
