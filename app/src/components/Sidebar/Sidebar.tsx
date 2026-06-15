import {type FormEvent, type JSX, useEffect, useMemo, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router";
import {useShallow} from "zustand/react/shallow";
import {useWorkspace} from "../../layouts/workspaceContext.ts";
import {useDirectChats} from "../../data/messaging.ts";
import {useCreateChannel} from "../../data/workspaces.ts";
import {useLogout} from "../../data/auth.ts";
import {useListNavigation} from "../../hooks/useListNavigation.ts";
import useModalStore from "../../store/useModalStore.ts";
import InlineHotkey from "../InlineHotkey/InlineHotkey.tsx";
import Avatar from "../Avatar/Avatar.tsx";
import Loader from "../Loader/Loader.tsx";
import styles from "./Sidebar.module.css";

interface NavItem {
  key: string;
  kind: "channel" | "dm";
  id: string;
  label: string;
  unread: number;
  user?: import("../../api/models").User;
}

function Sidebar(): JSX.Element {
  const {workspace, isAdmin} = useWorkspace();
  const navigate = useNavigate();
  const params = useParams();
  const openModal = useModalStore(useShallow((state) => state.openModal));

  const directChats = useDirectChats(workspace.id);
  const createChannel = useCreateChannel();
  const logout = useLogout();

  const navRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const createRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [channelName, setChannelName] = useState("");

  const items = useMemo<NavItem[]>(() => {
    const channels: NavItem[] = workspace.channels.map((channel) => ({
      key: `channel-${channel.id}`,
      kind: "channel",
      id: channel.id,
      label: `#${channel.name}`,
      unread: channel.newMessagesCount,
    }));
    const dms: NavItem[] = (directChats.data ?? []).map((chat) => ({
      key: `dm-${chat.id}`,
      kind: "dm",
      id: chat.id,
      label: `${chat.participant.name} ${chat.participant.surname}`,
      unread: chat.newMessagesCount,
      user: chat.participant,
    }));
    const query = search.trim().toLowerCase();
    return [...channels, ...dms].filter((item) =>
      item.label.toLowerCase().includes(query),
    );
  }, [workspace.channels, directChats.data, search]);

  function openItem(item: NavItem) {
    const path =
      item.kind === "channel"
        ? `/workspaces/${workspace.id}/channels/${item.id}`
        : `/workspaces/${workspace.id}/dms/${item.id}`;
    navigate(path);
  }

  const {activeIndex, setActiveIndex} = useListNavigation({
    length: items.length,
    target: navRef,
    onSelect: (index) => openItem(items[index]),
  });

  useEffect(() => {
    if (creating) createRef.current?.focus();
  }, [creating]);

  function submitChannel(event?: FormEvent) {
    event?.preventDefault();
    const name = channelName.trim();
    if (!name || createChannel.isPending) return;
    createChannel.mutate(
      {workspaceId: workspace.id, name},
      {
        onSuccess: () => {
          setChannelName("");
          setCreating(false);
        },
        onError: () => openModal({content: "Could not create the channel."}),
      },
    );
  }

  function confirmLogout() {
    openModal({
      content: "Log out of Szponcik?",
      options: [
        {label: "Logout", hotkey: "L", function: () => logout.mutate(undefined, {onSettled: () => navigate("/auth/login")})},
        {label: "Cancel", hotkey: "C", function: () => undefined},
      ],
    });
  }

  function showHelp() {
    openModal({
      content: (
        <div className={styles.help}>
          <h3>Keyboard shortcuts</h3>
          <ul>
            <li><span className="primary">/</span> search channels &amp; chats</li>
            <li><span className="primary">↑ ↓ Enter</span> navigate &amp; open (focus the list first)</li>
            <li><span className="primary">M</span> write a message &middot; <span className="primary">A</span> attach</li>
            <li><span className="primary">R</span> react &middot; <span className="primary">E</span> edit &middot; <span className="primary">D</span> delete (selected message)</li>
            {isAdmin && <li><span className="primary">C</span> create channel &middot; <span className="primary">G</span> workspace settings</li>}
            <li><span className="primary">U</span> members &middot; <span className="primary">P</span> profile &middot; <span className="primary">W</span> switch workspace</li>
          </ul>
        </div>
      ),
    });
  }

  const activeId = params.channelId ?? params.directChatId;

  return (
    <nav className={styles.sidebar}>
      <header className={styles.header}>
        <span className={styles.name} title={workspace.name}>{workspace.name}</span>
        <span className={styles.role}>{workspace.userRole}</span>
      </header>

      <div className={styles.search}>
        <InlineHotkey hotkeyFunction={() => searchRef.current?.focus()} hotkeyKey="/">
          Search
        </InlineHotkey>
        <input
          ref={searchRef}
          value={search}
          placeholder="filter…"
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setSearch("");
              event.currentTarget.blur();
            }
          }}
        />
      </div>

      <div ref={navRef} className={styles.list} tabIndex={0} aria-label="Channels and direct messages">
        <p className={styles.section}>Channels</p>
        {items.filter((item) => item.kind === "channel").length === 0 && (
          <p className={styles.empty}>no channels</p>
        )}
        {items.map((item, index) =>
          item.kind === "channel" ? (
            <Row
              key={item.key}
              item={item}
              active={index === activeIndex}
              open={activeId === item.id}
              onClick={() => {
                setActiveIndex(index);
                openItem(item);
              }}
            />
          ) : null,
        )}

        <p className={styles.section}>Direct messages</p>
        {directChats.isLoading && <p className={styles.empty}><Loader label="loading"/></p>}
        {!directChats.isLoading && items.filter((item) => item.kind === "dm").length === 0 && (
          <p className={styles.empty}>no conversations</p>
        )}
        {items.map((item, index) =>
          item.kind === "dm" ? (
            <Row
              key={item.key}
              item={item}
              active={index === activeIndex}
              open={activeId === item.id}
              onClick={() => {
                setActiveIndex(index);
                openItem(item);
              }}
            />
          ) : null,
        )}
      </div>

      {isAdmin && (
        <div className={styles.create}>
          {creating ? (
            <form onSubmit={submitChannel}>
              <input
                ref={createRef}
                value={channelName}
                placeholder="channel-name"
                onChange={(event) => setChannelName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setCreating(false);
                    setChannelName("");
                  }
                }}
              />
            </form>
          ) : (
            <InlineHotkey hotkeyFunction={() => setCreating(true)} hotkeyKey="C">
              Create channel
            </InlineHotkey>
          )}
        </div>
      )}

      <footer className={styles.footer}>
        <InlineHotkey hotkeyFunction={() => navigate(`/workspaces/${workspace.id}/members`)} hotkeyKey="U">Users</InlineHotkey>
        {isAdmin && (
          <InlineHotkey hotkeyFunction={() => navigate(`/workspaces/${workspace.id}/settings`)} hotkeyKey="G">Settings</InlineHotkey>
        )}
        <InlineHotkey hotkeyFunction={() => navigate("/settings")} hotkeyKey="P">Profile</InlineHotkey>
        <InlineHotkey hotkeyFunction={() => navigate("/workspaces")} hotkeyKey="W">Switch workspace</InlineHotkey>
        <InlineHotkey hotkeyFunction={showHelp} hotkeyKey="H">Help</InlineHotkey>
        <InlineHotkey hotkeyFunction={confirmLogout} hotkeyKey="Q">Quit</InlineHotkey>
      </footer>
    </nav>
  );
}

interface RowProps {
  item: NavItem;
  active: boolean;
  open: boolean;
  onClick: () => void;
}

function Row({item, active, open, onClick}: RowProps): JSX.Element {
  return (
    <button
      type="button"
      className={`${styles.row} ${active ? styles.active : ""} ${open ? styles.open : ""}`}
      onClick={onClick}
    >
      {item.user && <Avatar user={item.user} size={22}/>}
      <span className={styles.label}>{item.label}</span>
      {item.unread > 0 && <span className={styles.badge}>{item.unread}</span>}
    </button>
  );
}

export default Sidebar;
