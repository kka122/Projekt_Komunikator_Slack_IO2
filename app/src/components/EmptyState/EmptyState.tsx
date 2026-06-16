import {type JSX, type ReactNode} from "react";
import styles from "./EmptyState.module.css";

/** Props for {@link EmptyState}. */
interface EmptyStateProps {
  /** Primary message (e.g. "Channel not found"). */
  title: string;
  /** Optional secondary line — supporting text or a node such as a loader. */
  hint?: ReactNode;
}

/**
 * Centered placeholder shown when a screen has nothing to display (no channel
 * selected, empty list, not-found, …).
 */
function EmptyState({title, hint}: EmptyStateProps): JSX.Element {
  return (
    <div className={styles.empty}>
      <p className={styles.title}>{title}</p>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}

export default EmptyState;
