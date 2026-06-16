import {type HTMLProps, type JSX} from "react";
import {type Hotkey, useHotkey} from "@tanstack/react-hotkeys";
import useModalStore from "../../store/useModalStore.ts";
import styles from './InlineHotkey.module.css'

/** Props for {@link InlineHotkey}. */
interface InlineHotkeyProps extends HTMLProps<HTMLSpanElement> {
  /** Action run on click or when `hotkeyKey` is pressed (unless blocked). */
  hotkeyFunction: () => void;
  /** Keyboard key bound to this action. */
  hotkeyKey: Hotkey;
  /**
   * Which occurrence of `hotkeyKey` in the label to wrap in `[ ]`. Use a
   * negative value to append the bracketed key after the label instead.
   * Defaults to 0 (first occurrence).
   */
  letterIndex?: number;
  /** Disable the action and dim the label. */
  isBlocked?: boolean;
  /** Apply the "alert" styling (e.g. unread/attention). */
  hasAlert?: boolean;
  /** Apply the active/primary styling. */
  isActive?: boolean;
  /** Set by the Modal so its own options keep firing while a modal is open. */
  insideModal?: boolean;
  /** Label text. Must be a plain string so the hotkey letter can be located. */
  children: string;
}

/**
 * The app's core keyboard-first control: a clickable label that also binds a
 * hotkey, rendering its trigger key inline as `[k]`. Used everywhere in place of
 * buttons/links. While a modal is open, background hotkeys are suppressed unless
 * `insideModal` is set, so the modal's own options can't collide with them.
 */
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