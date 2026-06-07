import {type HTMLProps, type JSX} from "react";
import {type Hotkey, useHotkey} from "@tanstack/react-hotkeys";
import styles from './InlineHotkey.module.css'

interface InlineHotkeyProps extends HTMLProps<HTMLSpanElement> {
  hotkeyFunction: () => void;
  hotkeyKey: Hotkey;
}

function InlineHotkey({hotkeyFunction, hotkeyKey, ...props}: InlineHotkeyProps): JSX.Element {
  useHotkey(hotkeyKey, hotkeyFunction);

  return <span onClick={hotkeyFunction} className={styles.inlineHotkey} tabIndex={0} {...props}>
    <span className={'primary'}>[</span>
    {hotkeyKey}
    <span className={'primary'}>]</span>
  </span>
}

export default InlineHotkey;