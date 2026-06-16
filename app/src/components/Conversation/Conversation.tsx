import {type JSX, type ReactNode, useEffect, useMemo, useRef, useState} from "react";
import {useHotkey, useHotkeys} from "@tanstack/react-hotkeys";
import {useShallow} from "zustand/react/shallow";
import {
  type Conversation as ConversationTarget,
  useAddReaction,
  useDeleteMessage,
  useEditMessage,
  useMarkConversationRead,
  useMessages,
  useRemoveReaction,
  useSendMessage,
} from "../../data/messaging.ts";
import {useWorkspace} from "../../layouts/workspaceContext.ts";
import {useListNavigation} from "../../hooks/useListNavigation.ts";
import useModalStore from "../../store/useModalStore.ts";
import MessageList from "../MessageList/MessageList.tsx";
import MessageComposer from "../MessageComposer/MessageComposer.tsx";
import Loader from "../Loader/Loader.tsx";
import styles from "./Conversation.module.css";

/** Props for {@link Conversation}. */
interface ConversationProps {
  /** The channel or direct chat to render. */
  conversation: ConversationTarget;
  /** Header title (e.g. `#general` or a participant's name). */
  title: string;
  /** Optional header subtitle (e.g. the DM partner's status). */
  subtitle?: ReactNode;
}

/** Emoji presented in the quick-reaction modal, each bound to a number key. */
const QUICK_REACTIONS: {emoji: string; hotkey: "1" | "2" | "3" | "4" | "5"}[] = [
  {emoji: "👍", hotkey: "1"},
  {emoji: "❤️", hotkey: "2"},
  {emoji: "😂", hotkey: "3"},
  {emoji: "🎉", hotkey: "4"},
  {emoji: "😮", hotkey: "5"},
];

/**
 * Full message-thread view shared by channel and direct-chat screens. Loads the
 * messages, wires the keyboard workflow (arrow navigation, `R` react, `E` edit,
 * `D` delete, `M` jump to composer) and renders the {@link MessageList} plus
 * {@link MessageComposer}. Edit/delete permissions are enforced against the
 * current user and admin role; reactions, edits and deletes flow through the
 * messaging mutation hooks.
 */
function Conversation({conversation, title, subtitle}: ConversationProps): JSX.Element {
  const {currentUser, isAdmin} = useWorkspace();
  const openModal = useModalStore(useShallow((state) => state.openModal));
  const isModalOpen = useModalStore((state) => state.isOpen);

  const messagesQuery = useMessages(conversation);
  const sendMessage = useSendMessage(conversation);
  const editMessage = useEditMessage(conversation);
  const deleteMessage = useDeleteMessage(conversation);
  const addReaction = useAddReaction(conversation);
  const removeReaction = useRemoveReaction(conversation);
  const markRead = useMarkConversationRead();

  const listRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const messages = useMemo(() => messagesQuery.data ?? [], [messagesQuery.data]);

  const react = (index: number) => {
    const message = messages[index];
    if (!message) return;
    openModal({
      content: "Pick a reaction",
      options: QUICK_REACTIONS.map((entry) => ({
        label: entry.emoji,
        hotkey: entry.hotkey,
        function: () => addReaction.mutate({messageId: message.id, emoji: entry.emoji}),
      })),
    });
  };

  const startEdit = (index: number) => {
    const message = messages[index];
    if (!message) return;
    if (message.sender.id !== currentUser.id) {
      openModal({content: "You can only edit your own messages."});
      return;
    }
    setEditingId(message.id);
  };

  const confirmDelete = (index: number) => {
    const message = messages[index];
    if (!message) return;
    if (message.sender.id !== currentUser.id && !isAdmin) {
      openModal({content: "You can only delete your own messages."});
      return;
    }
    openModal({
      content: "Delete this message?",
      options: [
        {label: "Delete", hotkey: "D", function: () => deleteMessage.mutate(message.id)},
        {label: "Cancel", hotkey: "C", function: () => undefined},
      ],
    });
  };

  const toggleReaction = (messageId: string, emoji: string, mineReactionId: string | null) => {
    if (mineReactionId) {
      removeReaction.mutate({messageId, reactionId: mineReactionId});
    } else {
      addReaction.mutate({messageId, emoji});
    }
  };

  const {activeIndex} = useListNavigation({
    length: messages.length,
    target: listRef,
    enabled: editingId === null,
    onSelect: (index) => react(index),
  });

  const conversationId =
    conversation.kind === "channel" ? conversation.channelId : conversation.directChatId;

  // Focus the list once per chosen conversation so message arrow keys work
  // immediately. The list only mounts after messages load, so we wait for that
  // (skipping focus while loading would otherwise miss the first open).
  const focusedConversation = useRef<string | null>(null);
  useEffect(() => {
    if (messagesQuery.isLoading) return;
    if (focusedConversation.current === conversationId) return;
    if (listRef.current) {
      listRef.current.focus();
      focusedConversation.current = conversationId;
    }
  }, [conversationId, messagesQuery.isLoading]);

  useEffect(() => {
    const element = listRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages]);

  // Viewing a conversation clears its unread indicator. Re-mark when the
  // messages change too, so a message that arrives while open stays "read".
  const markReadMutate = markRead.mutate;
  useEffect(() => {
    if (messagesQuery.isLoading || messagesQuery.isError) return;
    markReadMutate(conversation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, messages, messagesQuery.isLoading, messagesQuery.isError]);

  // Per-message actions, scoped to the list so they never fire from the composer.
  useHotkeys(
    [
      {hotkey: "R", callback: () => react(activeIndex)},
      {hotkey: "E", callback: () => startEdit(activeIndex)},
      {hotkey: "D", callback: () => confirmDelete(activeIndex)},
    ],
    {target: listRef, enabled: editingId === null && messages.length > 0 && !isModalOpen},
  );

  // Jump to the composer from anywhere in the conversation view.
  useHotkey("M", () => composerRef.current?.focus(), {enabled: !isModalOpen});

  return (
    <div className={styles.conversation}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </header>

      {messagesQuery.isLoading ? (
        <div className={styles.state}><Loader label="loading messages"/></div>
      ) : messagesQuery.isError ? (
        <div className={styles.state}><span className="muted">Could not load messages.</span></div>
      ) : (
        <MessageList
          messages={messages}
          activeIndex={activeIndex}
          editingId={editingId}
          currentUserId={currentUser.id}
          listRef={listRef}
          onEditSave={(messageId, content) => {
            editMessage.mutate({messageId, content});
            setEditingId(null);
          }}
          onEditCancel={() => setEditingId(null)}
          onReactionClick={(message, emoji, mineReactionId) =>
            toggleReaction(message.id, emoji, mineReactionId)
          }
        />
      )}

      <MessageComposer
        textareaRef={composerRef}
        pending={sendMessage.isPending}
        placeholder={`Message ${title}`}
        onSend={(content, attachments) => sendMessage.mutate({content, attachments})}
        onEscape={() => listRef.current?.focus()}
      />
    </div>
  );
}

export default Conversation;
