import {type HTMLProps, type JSX} from "react";
import styles from "./BottomMenu.module.css";

/** Props for {@link BottomMenu}: standard div props plus required children. */
interface BottomMenuProps extends HTMLProps<HTMLDivElement> {
  /** Menu content (one or more elements). */
  children: JSX.Element | JSX.Element[];
  /**
   * Pin to the nearest positioned ancestor instead of the viewport — keeps the
   * bar inside a content column rather than spanning the whole app.
   */
  contained?: boolean;
}

/**
 * Strip pinned to the bottom of the screen (or of its positioned ancestor when
 * `contained`). Layout primitive used by {@link HintBar} and other footer UIs.
 */
function BottomMenu({children, contained, className, ...props}: BottomMenuProps): JSX.Element {
  return <div className={`${styles.bottomMenu} ${contained ? styles.contained : ""} ${className ?? ""}`} {...props}>
    {children}
  </div>
}

export default BottomMenu;