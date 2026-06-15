import {type JSX, type KeyboardEvent, useRef} from "react";
import {type Hotkey} from "@tanstack/react-hotkeys";
import InlineHotkey from "../InlineHotkey/InlineHotkey.tsx";
import styles from "./Field.module.css";

interface FieldProps {
  label: string;
  hotkeyKey: Hotkey;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  letterIndex?: number;
  multiline?: boolean;
}

// Labeled input whose label is an InlineHotkey: pressing the key focuses the
// field. Escape blurs so the surrounding screen's hotkeys take over again.
function Field({
  label,
  hotkeyKey,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  letterIndex = 0,
  multiline = false,
}: FieldProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  function focusInput() {
    inputRef.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      inputRef.current?.blur();
    }
  }

  return (
    <label className={styles.field}>
      <InlineHotkey hotkeyFunction={focusInput} hotkeyKey={hotkeyKey} letterIndex={letterIndex}>
        {label}
      </InlineHotkey>
      {multiline ? (
        <textarea
          ref={inputRef}
          value={value}
          placeholder={placeholder}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
        />
      ) : (
        <input
          ref={inputRef}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
        />
      )}
    </label>
  );
}

export default Field;
