import {type JSX, type KeyboardEvent, type RefObject, useState} from "react";
import type {Message, Reaction} from "../../api/models";
import Avatar from "../Avatar/Avatar.tsx";
import {resolveAssetUrl} from "../../config/api.ts";
import styles from "./MessageList.module.css";

/**
 * Reaction click handler. When `mineReactionId` is set the caller already
 * reacted with `emoji`, so the toggle removes that reaction; otherwise it adds a
 * new reaction with `emoji`.
 */
type ReactionToggle = (message: Message, emoji: string, mineReactionId: string | null) => void;

/** Props for {@link MessageList}. */
interface MessageListProps {
  /** Messages to render, oldest-first. */
  messages: Message[];
  /** Index of the keyboard-selected message (highlighted). */
  activeIndex: number;
  /** Id of the message currently being edited inline, or null. */
  editingId: string | null;
  /** Signed-in user's id, used to flag own messages and own reactions. */
  currentUserId: string;
  /** Ref to the scroll container (focused for keyboard navigation). */
  listRef: RefObject<HTMLDivElement | null>;
  /** Called to persist an inline edit. */
  onEditSave: (messageId: string, content: string) => void;
  /** Called to abandon an inline edit. */
  onEditCancel: () => void;
  /** Called when a reaction chip is clicked (see {@link ReactionToggle}). */
  onReactionClick: ReactionToggle;
}

/**
 * Format an ISO timestamp as a short, locale-aware "Mon D, HH:MM" label.
 *
 * @returns The formatted string, or `""` for an unparseable timestamp.
 */
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

/** Format a byte count as a human-readable size (B/KB/MB). */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** One emoji's aggregated reactions on a message. */
interface GroupedReaction {
  /** The emoji. */
  emoji: string;
  /** How many users reacted with it. */
  count: number;
  /** The caller's own reaction of this emoji, if any (enables toggling off). */
  mine: Reaction | null;
  /** Any one reaction of this emoji, used for the tooltip. */
  sample: Reaction;
}

/**
 * Collapse a flat reaction list into one {@link GroupedReaction} per emoji,
 * counting occurrences and flagging the caller's own reaction.
 */
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

/**
 * Scrollable list of messages for a conversation. Renders one
 * {@link MessageItem} per message, highlighting the active one and switching the
 * selected message into inline-edit mode. Shows an empty hint when there are no
 * messages.
 */
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

/** Props for {@link MessageItem}. */
interface MessageItemProps {
  /** The message to render. */
  message: Message;
  /** Whether this row is the keyboard-selected one. */
  active: boolean;
  /** Whether this row is in inline-edit mode. */
  editing: boolean;
  /** Whether the message was sent by the current user. */
  isMine: boolean;
  /** Signed-in user's id (to flag own reactions). */
  currentUserId: string;
  /** Called to persist an inline edit. */
  onEditSave: (messageId: string, content: string) => void;
  /** Called to abandon an inline edit. */
  onEditCancel: () => void;
  /** Called when a reaction chip is clicked (see {@link ReactionToggle}). */
  onReactionClick: ReactionToggle;
}

/**
 * A single message row: avatar, sender, timestamp, body (or an edit textarea
 * when `editing`), attachment links and grouped reaction chips. In edit mode,
 * Enter saves and Escape cancels.
 */
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
