import {type HTMLProps, type JSX} from "react";
import {type Hotkey, useHotkey} from "@tanstack/react-hotkeys";
import styles from './InlineHotkey.module.css'

interface InlineHotkeyProps extends HTMLProps<HTMLSpanElement> {
  hotkeyFunction: () => void;
  hotkeyKey: Hotkey;
  letterIndex?: number;
  isBlocked?: boolean;
  children: string;
}

function InlineHotkey({
                        hotkeyFunction,
                        hotkeyKey,
                        letterIndex = 0,
                        isBlocked,
                        children,
                        ...props
                      }: InlineHotkeyProps): JSX.Element {
  useHotkey(hotkeyKey, execHotkeyFunction);

  function execHotkeyFunction() {
    if (!isBlocked) {
      hotkeyFunction();
    }
  }

  let indexCount = 0;
  let start = '';
  let end = '';
  children.split('').forEach((letter, index) => {
    if (letter.toLowerCase() === hotkeyKey.toLowerCase()) {
      indexCount++;

      if (indexCount === letterIndex + 1) {
        start = children.substring(0, index);
        end = children.substring(index + 1);
      }
    }
  })

  return <span onClick={execHotkeyFunction}
               className={`${styles.inlineHotkey} ${isBlocked ? styles.blocked : undefined}`} {...props}>
    {start}
    <span className={'primary'}>[</span>
    {hotkeyKey}
    <span className={'primary'}>]</span>
    {end}
  </span>
}

export default InlineHotkey;