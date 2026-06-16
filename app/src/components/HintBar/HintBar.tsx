import {type JSX, type ReactNode} from "react";
import BottomMenu from "../BottomMenu/BottomMenu.tsx";
import styles from "./HintBar.module.css";

/** Props for {@link HintBar}. */
interface HintBarProps {
  /** Hotkey hints to display — typically a row of {@link InlineHotkey}s. */
  children: ReactNode;
  /**
   * Anchor to the nearest positioned ancestor (e.g. the layout's main column)
   * instead of the viewport, so the bar doesn't overlay a sibling sidebar.
   */
  contained?: boolean;
}

/**
 * Persistent bottom strip that advertises the active screen's hotkeys. Thin
 * wrapper over {@link BottomMenu} with hint-row styling.
 */
function HintBar({children, contained}: HintBarProps): JSX.Element {
  return (
    <BottomMenu contained={contained}>
      <div className={styles.hintBar}>{children}</div>
    </BottomMenu>
  );
}

export default HintBar;
