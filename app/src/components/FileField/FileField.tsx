import {type JSX, useRef} from "react";
import {type Hotkey} from "@tanstack/react-hotkeys";
import InlineHotkey from "../InlineHotkey/InlineHotkey.tsx";
import styles from "./FileField.module.css";

/** Props for {@link FileField}. */
interface FileFieldProps {
  /** Visible label text (rendered as an {@link InlineHotkey}). */
  label: string;
  /** Key that opens the file picker. */
  hotkeyKey: Hotkey;
  /** Currently selected file, or null. */
  file: File | null;
  /** Called with the chosen file (or null when cleared). */
  onChange: (file: File | null) => void;
  /** Accepted MIME types for the picker. Defaults to "image/*". */
  accept?: string;
  /** Which occurrence of `hotkeyKey` in the label to highlight. Defaults to 0. */
  letterIndex?: number;
}

/**
 * Hotkey-driven file picker: the visible label is an {@link InlineHotkey} that
 * clicks a hidden `<input type="file">`. Shows the selected file name beside it.
 */
function FileField({
  label,
  hotkeyKey,
  file,
  onChange,
  accept = "image/*",
  letterIndex = 0,
}: FileFieldProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.fileField}>
      <InlineHotkey
        hotkeyFunction={() => inputRef.current?.click()}
        hotkeyKey={hotkeyKey}
        letterIndex={letterIndex}
      >
        {label}
      </InlineHotkey>
      <span className={styles.name}>{file ? file.name : "no file selected"}</span>
      <input
        ref={inputRef}
        className="srOnly"
        type="file"
        accept={accept}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </div>
  );
}

export default FileField;
