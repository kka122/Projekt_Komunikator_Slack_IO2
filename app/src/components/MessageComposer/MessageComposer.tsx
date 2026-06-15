import {type JSX, type KeyboardEvent, type RefObject, useRef, useState} from "react";
import InlineHotkey from "../InlineHotkey/InlineHotkey.tsx";
import styles from "./MessageComposer.module.css";

interface MessageComposerProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  pending: boolean;
  placeholder: string;
  onSend: (content: string, attachments: File[]) => void;
  onEscape: () => void;
}

// Bottom composer: Enter sends, Shift+Enter inserts a newline, Escape hands
// focus back to the message list. Files attach via the [A] hotkey.
function MessageComposer({
  textareaRef,
  pending,
  placeholder,
  onSend,
  onEscape,
}: MessageComposerProps): JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  function send() {
    if (pending) return;
    if (content.trim().length === 0 && attachments.length === 0) return;
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
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={onKeyDown}
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
