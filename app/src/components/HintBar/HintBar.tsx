import {type JSX, type ReactNode} from "react";
import BottomMenu from "../BottomMenu/BottomMenu.tsx";
import styles from "./HintBar.module.css";

interface HintBarProps {
  children: ReactNode;
}

// Persistent bottom strip that advertises the active screen's hotkeys.
function HintBar({children}: HintBarProps): JSX.Element {
  return (
    <BottomMenu>
      <div className={styles.hintBar}>{children}</div>
    </BottomMenu>
  );
}

export default HintBar;
