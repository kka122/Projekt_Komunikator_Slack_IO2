import {type JSX, type KeyboardEvent, type RefObject, useState} from "react";
import type {Message, Reaction} from "../../api/models";
import Avatar from "../Avatar/Avatar.tsx";
import {resolveAssetUrl} from "../../config/api.ts";
import styles from "./MessageList.module.css";

// Toggling a reaction either removes the caller's existing one (mineReactionId
// set) or adds a new reaction with that emoji.
type ReactionToggle = (message: Message, emoji: string, mineReactionId: string | null) => void;

interface MessageListProps {
  messages: Message[];
  activeIndex: number;
  editingId: string | null;
  currentUserId: string;
  listRef: RefObject<HTMLDivElement | null>;
  onEditSave: (messageId: string, content: string) => void;
  onEditCancel: () => void;
  onReactionClick: ReactionToggle;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface GroupedReaction {
  emoji: string;
  count: number;
  mine: Reaction | null;
  sample: Reaction;
}

function groupReactions(reactions: Reaction[], currentUserId: string): GroupedReaction[] {
  const map = new Map<string, GroupedReaction>();
  for (const reaction of reactions) {
    const existing = map.get(reaction.emoji);
    if (existing) {
      existing.count += 1;
      if (reaction.user.id === currentUserId) existing.mine = reaction;
    } else {
      map.set(reaction.emoji, {
        emoji: reaction.emoji,
        count: 1,
        mine: reaction.user.id === currentUserId ? reaction : null,
        sample: reaction,
      });
    }
  }
  return [...map.values()];
}

function MessageList({
  messages,
  activeIndex,
  editingId,
  currentUserId,
  listRef,
  onEditSave,
  onEditCancel,
  onReactionClick,
}: MessageListProps): JSX.Element {
  return (
    <div ref={listRef} className={styles.list} tabIndex={0} aria-label="Messages">
      {messages.length === 0 && (
        <p className={styles.empty}>No messages yet. Press <span className="primary">M</span> to write the first one.</p>
      )}
      {messages.map((message, index) => (
        <MessageItem
          key={message.id}
          message={message}
          active={index === activeIndex}
          editing={editingId === message.id}
          isMine={message.sender.id === currentUserId}
          currentUserId={currentUserId}
          onEditSave={onEditSave}
          onEditCancel={onEditCancel}
          onReactionClick={onReactionClick}
        />
      ))}
    </div>
  );
}

interface MessageItemProps {
  message: Message;
  active: boolean;
  editing: boolean;
  isMine: boolean;
  currentUserId: string;
  onEditSave: (messageId: string, content: string) => void;
  onEditCancel: () => void;
  onReactionClick: ReactionToggle;
}

function MessageItem({
  message,
  active,
  editing,
  isMine,
  currentUserId,
  onEditSave,
  onEditCancel,
  onReactionClick,
}: MessageItemProps): JSX.Element {
  const [draft, setDraft] = useState(message.content);
  const reactions = groupReactions(message.reactions ?? [], currentUserId);

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (draft.trim().length > 0) onEditSave(message.id, draft.trim());
    } else if (event.key === "Escape") {
      event.preventDefault();
      onEditCancel();
    }
  }

  return (
    <article className={`${styles.message} ${active ? styles.active : ""} ${isMine ? styles.mine : ""}`}>
      <Avatar user={message.sender} size={34}/>
      <div className={styles.body}>
        <header className={styles.meta}>
          <span className={styles.sender}>{message.sender.name} {message.sender.surname}</span>
          <span className={styles.time}>{formatTime(message.timestamp)}</span>
          {message.isEdited && <span className={styles.edited}>(edited)</span>}
        </header>

        {editing ? (
          <textarea
            className={styles.editArea}
            autoFocus
            value={draft}
            rows={2}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
          />
        ) : (
          <p className={styles.content}>{message.content}</p>
        )}

        {message.attachments && message.attachments.length > 0 && (
          <ul className={styles.attachments}>
            {message.attachments.map((attachment) => (
              <li key={attachment.id}>
                <a href={resolveAssetUrl(attachment.url)} target="_blank" rel="noreferrer">{attachment.filename}</a>
                <span className="muted">{formatSize(attachment.size)}</span>
              </li>
            ))}
          </ul>
        )}

        {reactions.length > 0 && (
          <div className={styles.reactions}>
            {reactions.map((reaction) => (
              <button
                type="button"
                key={reaction.emoji}
                className={`${styles.reaction} ${reaction.mine ? styles.reactionMine : ""}`}
                title={reaction.sample.user.name}
                onClick={() => onReactionClick(message, reaction.emoji, reaction.mine?.id ?? null)}
              >
                <span>{reaction.emoji}</span>
                <span className={styles.reactionCount}>{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export default MessageList;
