import {type JSX} from "react";
import {AnimatePresence, type HTMLMotionProps, motion} from "framer-motion";
import {useHotkey} from "@tanstack/react-hotkeys";
import useModalStore from "../../store/useModalStore.ts";
import {useShallow} from "zustand/react/shallow";
import InlineHotkey from "../InlineHotkey/InlineHotkey.tsx";
import styles from './Modal.module.css'

/** Fade variants for the modal dialog. */
const variants = {
  initial: {opacity: 0},
  animate: {opacity: 1},
  exit: {opacity: 0}
}

/** Props for {@link Modal}: motion `<dialog>` props forwarded to the element. */
type ModalProps = HTMLMotionProps<'dialog'>

/**
 * The app's single global modal, driven by {@link useModalStore}. Mounted once
 * in {@link Root}. Renders the store's `content` plus a row of hotkey-bound
 * options (or a default "Ok"); each option runs its action then closes. Escape
 * always dismisses.
 */
function Modal({...props}: ModalProps): JSX.Element {
  const {
    isOpen,
    content,
    options,
    closeModal,
  } = useModalStore(useShallow(state => ({
    isOpen: state.isOpen,
    content: state.content,
    options: state.options,
    closeModal: state.closeModal,
  })));

  function execOptionFunction(func: () => void) {
    func();
    closeModal();
  }

  // Escape always dismisses the open modal.
  useHotkey("Escape", closeModal, {enabled: isOpen});

  return <AnimatePresence>
    {isOpen && <motion.dialog {...props}
                              className={styles.modal}
                              open
                              variants={variants}
                              initial={'initial'}
                              animate={'animate'}
                              exit={'exit'}
                              transition={{duration: 0.3}}>
      <div className={styles.con}>
        {content}
        <div className={styles.options}>
          {options && options.length > 0 ? options.map((option, index) => {
            return <InlineHotkey key={index} insideModal hotkeyFunction={() => execOptionFunction(option.function)}
                                 hotkeyKey={option.hotkey}>{option.label}</InlineHotkey>
          }) : <InlineHotkey insideModal hotkeyFunction={closeModal} hotkeyKey={'O'}>Ok</InlineHotkey>}
        </div>
      </div>
    </motion.dialog>}
  </AnimatePresence>
}

export default Modal;