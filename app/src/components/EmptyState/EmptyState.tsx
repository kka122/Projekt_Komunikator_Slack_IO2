import {type JSX, type ReactNode} from "react";
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  title: string;
  hint?: ReactNode;
}

function EmptyState({title, hint}: EmptyStateProps): JSX.Element {
  return (
    <div className={styles.empty}>
      <p className={styles.title}>{title}</p>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}

export default EmptyState;
