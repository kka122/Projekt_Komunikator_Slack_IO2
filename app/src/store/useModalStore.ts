import {create} from 'zustand'
import type {Hotkey} from "@tanstack/react-hotkeys";

interface ModalOption {
  label: string
  hotkey: Hotkey
  function: () => void
}

export type OpenModalOptions = Omit<ModalStoreData, 'isOpen'>

interface ModalStoreData {
  isOpen: boolean
  content: string
  options?: ModalOption[]
  onClose?: () => void
}

interface ModalStoreActions {
  openModal: (data: OpenModalOptions) => void
  closeModal: () => void
}

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