import {type JSX, type KeyboardEvent, useRef} from "react";
import {type Hotkey} from "@tanstack/react-hotkeys";
import InlineHotkey from "../InlineHotkey/InlineHotkey.tsx";
import styles from "./Field.module.css";

/** Props for {@link Field}. */
interface FieldProps {
  /** Visible label text (rendered as an {@link InlineHotkey}). */
  label: string;
  /** Key that focuses this field. */
  hotkeyKey: Hotkey;
  /** Controlled input value. */
  value: string;
  /** Called with the new value on every keystroke. */
  onChange: (value: string) => void;
  /** Input `type` (e.g. "email", "password"). Ignored when `multiline`. Defaults to "text". */
  type?: string;
  /** Placeholder text. */
  placeholder?: string;
  /** Native `autocomplete` hint. */
  autoComplete?: string;
  /** Which occurrence of `hotkeyKey` in the label to highlight. Defaults to 0. */
  letterIndex?: number;
  /** Render a `<textarea>` instead of an `<input>`. Defaults to false. */
  multiline?: boolean;
}

/**
 * Labeled text field whose label is an {@link InlineHotkey}: pressing the key
 * focuses the input. Escape blurs so the surrounding screen's hotkeys take over
 * again. Renders an `<input>` or, when `multiline`, a `<textarea>`.
 */
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
