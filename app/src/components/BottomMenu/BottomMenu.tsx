import {type HTMLProps, type JSX} from "react";
import styles from "./BottomMenu.module.css";

/** Props for {@link BottomMenu}: standard div props plus required children. */
interface BottomMenuProps extends HTMLProps<HTMLDivElement> {
  /** Menu content (one or more elements). */
  children: JSX.Element | JSX.Element[];
}

/**
 * Fixed strip pinned to the bottom of the screen. Layout primitive used by
 * {@link HintBar} and other footer-style UIs.
 */
function BottomMenu({children, ...props}: BottomMenuProps): JSX.Element {
  return <div className={styles.bottomMenu} {...props}>
    {children}
  </div>
}

export default BottomMenu;