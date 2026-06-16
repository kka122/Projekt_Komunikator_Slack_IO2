import {type JSX, type ReactNode} from "react";
import BottomMenu from "../BottomMenu/BottomMenu.tsx";
import styles from "./HintBar.module.css";

/** Props for {@link HintBar}. */
interface HintBarProps {
  /** Hotkey hints to display — typically a row of {@link InlineHotkey}s. */
  children: ReactNode;
}

/**
 * Persistent bottom strip that advertises the active screen's hotkeys. Thin
 * wrapper over {@link BottomMenu} with hint-row styling.
 */
function HintBar({children}: HintBarProps): JSX.Element {
  return (
    <BottomMenu>
      <div className={styles.hintBar}>{children}</div>
    </BottomMenu>
  );
}

export default HintBar;
