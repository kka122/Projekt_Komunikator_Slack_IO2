import {create} from 'zustand'
import type {Hotkey} from "@tanstack/react-hotkeys";
import type {ReactNode} from "react";

/** A single hotkey-driven action button rendered in the modal's option row. */
interface ModalOption {
  /** Visible button text. */
  label: string
  /** Key that triggers this option while the modal is open. */
  hotkey: Hotkey
  /** Action run when the option fires (the modal closes afterwards). */
  function: () => void
}

/** State held by {@link useModalStore}. */
interface ModalStoreData {
  /** Whether the modal is currently visible. */
  isOpen: boolean
  /** Body content (string or arbitrary React node). */
  content: ReactNode
  /** Optional action buttons; when omitted the modal shows a single "Ok". */
  options?: ModalOption[]
  /** Callback fired once when the modal closes (success/cancel/Escape). */
  onClose?: () => void
}

/** Argument accepted by `openModal` — everything except the `isOpen` flag. */
export type OpenModalOptions = Omit<ModalStoreData, 'isOpen'>

/** Actions exposed by {@link useModalStore}. */
interface ModalStoreActions {
  /** Open the global modal with the given content/options. */
  openModal: (data: OpenModalOptions) => void
  /** Close the modal, invoking the active `onClose` first if present. */
  closeModal: () => void
}

/**
 * Global modal store (zustand). The app renders a single {@link Modal} driven by
 * this state, so any component can pop a dialog via `openModal` without local
 * wiring. `closeModal` runs the registered `onClose` exactly once.
 */
const useModalStore = create<ModalStoreData & ModalStoreActions>((set) => ({
  isOpen: false,
  content: '',

  openModal: (data) => set({
    isOpen: true,
    content: data.content,
    options: data.options,
    onClose: data.onClose,
  }),
  closeModal: () => set((state) => {
    if (state.onClose) state.onClose();
    return {isOpen: false}
  }),
}))

export default useModalStore;