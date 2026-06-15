import {type HTMLProps, type JSX} from "react";
import {type Hotkey, useHotkey} from "@tanstack/react-hotkeys";
import useModalStore from "../../store/useModalStore.ts";
import styles from './InlineHotkey.module.css'

interface InlineHotkeyProps extends HTMLProps<HTMLSpanElement> {
  hotkeyFunction: () => void;
  hotkeyKey: Hotkey;
  letterIndex?: number;
  isBlocked?: boolean;
  hasAlert?: boolean;
  isActive?: boolean;
  /** Set by the Modal so its own options keep firing while a modal is open. */
  insideModal?: boolean;
  children: string;
}

function InlineHotkey({
                        hotkeyFunction,
                        hotkeyKey,
                        letterIndex = 0,
                        isBlocked,
                        hasAlert,
                        isActive,
                        insideModal,
                        children,
                        className,
                        ...props
                      }: InlineHotkeyProps): JSX.Element {
  const isModalOpen = useModalStore((state) => state.isOpen);
  // Background shortcuts go quiet while a modal is open so they cannot collide
  // with the modal's own option keys.
  const blocked = isBlocked || (isModalOpen && !insideModal);

  useHotkey(hotkeyKey, execHotkeyFunction);

  function execHotkeyFunction() {
    if (!blocked) {
      hotkeyFunction();
    }
  }

  let indexCount = 0;
  let start = '';
  let end = '';
  children.split('').forEach((letter, index) => {
    if (letter.toLowerCase() === hotkeyKey.toLowerCase()) {
      indexCount++;

      if (indexCount <= letterIndex + 1) {
        start = children.substring(0, index);
        end = children.substring(index + 1);
      }
    }
    if (index === children.length - 1 && (indexCount === 0 || letterIndex < 0)) {
      start = children + ' ';
      end = '';
    }
  })

  return <span {...props} onClick={execHotkeyFunction}
               className={`${styles.inlineHotkey} ${isBlocked ? styles.blocked : undefined} ${hasAlert ? styles.alert : undefined} 
               ${isActive ? 'primary' : undefined} ${className ?? undefined}`}>
    {start}
      <span className={'primary'}>[</span>
      {hotkeyKey}
      <span className={'primary'}>]</span>
      {end}
  </span>
}

export default InlineHotkey;