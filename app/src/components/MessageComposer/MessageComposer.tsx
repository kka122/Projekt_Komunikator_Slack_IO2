import {type JSX, type KeyboardEvent, type RefObject, useEffect, useRef, useState} from "react";
import InlineHotkey from "../InlineHotkey/InlineHotkey.tsx";
import styles from "./MessageComposer.module.css";

/** Idle time after the last keystroke before the typing signal is cleared. */
const TYPING_IDLE_MS = 1500;

/** Props for {@link MessageComposer}. */
interface MessageComposerProps {
  /** Ref to the textarea, so the parent can focus it (e.g. on the `M` hotkey). */
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  /** Whether a send is in flight — disables the send action. */
  pending: boolean;
  /** Textarea placeholder text. */
  placeholder: string;
  /** Called with the trimmed content and any attachments when the user sends. */
  onSend: (content: string, attachments: File[]) => void;
  /** Called when Escape is pressed (parent typically refocuses the list). */
  onEscape: () => void;
  /**
   * Optional typing-state callback. Fired with `true` when the user starts
   * typing and `false` when they stop (idle, send, blur or unmount), so the
   * parent can broadcast a typing indicator.
   */
  onTyping?: (isTyping: boolean) => void;
}

/**
 * Bottom message composer. Enter sends, Shift+Enter inserts a newline, Escape
 * calls `onEscape`. Files attach via the `[A]` hotkey and can be removed before
 * sending; the input clears after a successful send.
 */
function MessageComposer({
  textareaRef,
  pending,
  placeholder,
  onSend,
  onEscape,
  onTyping,
}: MessageComposerProps): JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  // Typing-broadcast state: emit `true` once on the first keystroke, then `false`
  // after a short idle. Kept in refs so it never triggers a re-render.
  const typingActive = useRef(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function stopTyping() {
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
      typingTimer.current = null;
    }
    if (typingActive.current) {
      typingActive.current = false;
      onTyping?.(false);
    }
  }

  function signalTyping() {
    if (!onTyping) return;
    if (!typingActive.current) {
      typingActive.current = true;
      onTyping(true);
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  }

  // Make sure we never leave a stale "typing…" indicator behind.
  useEffect(() => stopTyping, []); // eslint-disable-line react-hooks/exhaustive-deps

  function onChange(value: string) {
    setContent(value);
    if (value.trim().length > 0) signalTyping();
    else stopTyping();
  }

  function send() {
    if (pending) return;
    if (content.trim().length === 0 && attachments.length === 0) return;
    stopTyping();
    onSend(content.trim(), attachments);
    setContent("");
    setAttachments([]);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    } else if (event.key === "Escape") {
      event.preventDefault();
      stopTyping();
      onEscape();
    }
  }

  function addFiles(list: FileList | null) {
    if (list) setAttachments((current) => [...current, ...Array.from(list)]);
  }

  return (
    <div className={styles.composer}>
      {attachments.length > 0 && (
        <ul className={styles.attachments}>
          {attachments.map((file, index) => (
            <li key={`${file.name}-${index}`}>
              <span>{file.name}</span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() =>
                  setAttachments((current) => current.filter((_, i) => i !== index))
                }
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.inputRow}>
        <textarea
          ref={textareaRef}
          value={content}
          placeholder={placeholder}
          rows={1}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={stopTyping}
        />
        <div className={styles.actions}>
          <InlineHotkey hotkeyFunction={() => fileRef.current?.click()} hotkeyKey="A">Attach</InlineHotkey>
          <InlineHotkey hotkeyFunction={send} hotkeyKey="S" isBlocked={pending}>Send</InlineHotkey>
        </div>
        <input
          ref={fileRef}
          className="srOnly"
          type="file"
          multiple
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

export default MessageComposer;
