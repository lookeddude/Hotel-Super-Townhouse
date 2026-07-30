'use client';

import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type ReactNode,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModalType =
  | 'confirmation'
  | 'delete'
  | 'image-preview'
  | 'success'
  | 'warning'
  | 'error'
  | 'custom';

interface ModalState {
  isOpen: boolean;
  type: ModalType | null;
  title?: string;
  description?: string;
  data?: unknown;
  onConfirm?: () => void;
  onCancel?: () => void;
}

type ModalAction =
  | { type: 'OPEN_MODAL'; payload: Omit<ModalState, 'isOpen'> }
  | { type: 'CLOSE_MODAL' };

interface ModalContextValue {
  state: ModalState;
  openModal: (payload: Omit<ModalState, 'isOpen'>) => void;
  closeModal: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ModalContext = createContext<ModalContextValue | null>(null);

// ─── Reducer ──────────────────────────────────────────────────────────────────

const initialState: ModalState = {
  isOpen: false,
  type: null,
};

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'OPEN_MODAL':
      return { ...action.payload, isOpen: true };
    case 'CLOSE_MODAL':
      return initialState;
    default:
      return state;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ModalProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(modalReducer, initialState);

  const openModal = useCallback((payload: Omit<ModalState, 'isOpen'>) => {
    dispatch({ type: 'OPEN_MODAL', payload });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, []);

  return (
    <ModalContext.Provider value={{ state, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
