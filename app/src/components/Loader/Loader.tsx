import {type JSX} from "react";
import styles from "./Loader.module.css";

interface LoaderProps {
  label?: string;
}

function Loader({label = "loading"}: LoaderProps): JSX.Element {
  return (
    <span className={styles.loader} role="status">
      {label}
      <span className={styles.caret}>▍</span>
    </span>
  );
}

export default Loader;
