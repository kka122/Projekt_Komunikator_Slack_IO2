import {type HTMLProps, type JSX} from "react";

type ModalProps = HTMLProps<HTMLDialogElement>

function Modal({children, ...props}: ModalProps): JSX.Element {
  return <dialog open {...props}>
    {children}
  </dialog>
}

export default Modal;