import {type JSX, useRef} from "react";
import {type Hotkey} from "@tanstack/react-hotkeys";
import InlineHotkey from "../InlineHotkey/InlineHotkey.tsx";
import styles from "./FileField.module.css";

interface FileFieldProps {
  label: string;
  hotkeyKey: Hotkey;
  file: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  letterIndex?: number;
}

// File picker driven by a hotkey: the visible label is an InlineHotkey that
// clicks a hidden <input type="file">.
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
