import {type HTMLProps, type JSX} from "react";
import styles from "./BottomMenu.module.css";

interface BottomMenuProps extends HTMLProps<HTMLDivElement> {
  children: JSX.Element | JSX.Element[];
}

function BottomMenu({children, ...props}: BottomMenuProps): JSX.Element {
  return <div className={styles.bottomMenu} {...props}>
    {children}
  </div>
}

export default BottomMenu;