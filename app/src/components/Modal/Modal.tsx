import {type JSX} from "react";
import {AnimatePresence, type HTMLMotionProps, motion} from "framer-motion";
import useModalStore from "../../store/useModalStore.ts";
import {useShallow} from "zustand/react/shallow";
import InlineHotkey from "../InlineHotkey/InlineHotkey.tsx";
import styles from './Modal.module.css'

const variants = {
  initial: {opacity: 0},
  animate: {opacity: 1},
  exit: {opacity: 0}
}

type ModalProps = HTMLMotionProps<'dialog'>

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
            return <InlineHotkey key={index} hotkeyFunction={() => execOptionFunction(option.function)}
                                 hotkeyKey={option.hotkey}>{option.label}</InlineHotkey>
          }) : <InlineHotkey hotkeyFunction={closeModal} hotkeyKey={'O'}>Ok</InlineHotkey>}
        </div>
      </div>
    </motion.dialog>}
  </AnimatePresence>
}

export default Modal;