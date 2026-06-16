import {type JSX} from "react";
import styles from "./Loader.module.css";

/** Props for {@link Loader}. */
interface LoaderProps {
  /** Text shown next to the blinking caret. Defaults to "loading". */
  label?: string;
}

/**
 * Inline loading indicator: a label plus a blinking terminal-style caret.
 * Carries `role="status"` for assistive tech.
 */
function Loader({label = "loading"}: LoaderProps): JSX.Element {
  return (
    <span className={styles.loader} role="status">
      {label}
      <span className={styles.caret}>▍</span>
    </span>
  );
}

export default Loader;
