// store.d.ts
import { store } from './store'; // Adjust the import path to your store.js

// Infer RootState and AppDispatch from the store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use typed dispatch in components
import { useDispatch } from 'react-redux';
export const useAppDispatch: () => AppDispatch = useDispatch;
