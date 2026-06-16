import {type JSX, useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router";
import {useHotkey} from "@tanstack/react-hotkeys";
import {useShallow} from "zustand/react/shallow";
import {useWorkspace} from "../../layouts/workspaceContext.ts";
import {useDeleteChannel, useDeleteWorkspace, useRenameChannel, useUpdateWorkspaceLogo} from "../../data/workspaces.ts";
import {useListNavigation} from "../../hooks/useListNavigation.ts";
import useModalStore from "../../store/useModalStore.ts";
import InlineHotkey from "../../components/InlineHotkey/InlineHotkey.tsx";
import FileField from "../../components/FileField/FileField.tsx";
import EmptyState from "../../components/EmptyState/EmptyState.tsx";
import styles from "./WorkspaceSettingsPage.module.css";

/**
 * Workspace settings screen (`settings`), admin/owner only. Updates the
 * workspace logo and manages channels: keyboard-navigable list with rename
 * (`R`) and delete (`D`). Non-admins see an {@link EmptyState}.
 */
function WorkspaceSettingsPage(): JSX.Element {
  const {workspace, isAdmin, isOwner} = useWorkspace();
  const navigate = useNavigate();
  const openModal = useModalStore(useShallow((state) => state.openModal));
  const isModalOpen = useModalStore((state) => state.isOpen);

  const updateLogo = useUpdateWorkspaceLogo();
  const renameChannel = useRenameChannel();
  const deleteChannel = useDeleteChannel();
  const deleteWorkspace = useDeleteWorkspace();

  const channelsRef = useRef<HTMLDivElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const channels = workspace.channels;

  const beginRename = (index: number) => {
    const channel = channels[index];
    if (!channel) return;
    setRenameValue(channel.name);
    setRenamingId(channel.id);
  };

  const commitRename = () => {
    const name = renameValue.trim();
    if (!renamingId || !name) {
      setRenamingId(null);
      return;
    }
    renameChannel.mutate(
      {workspaceId: workspace.id, channelId: renamingId, name},
      {onError: () => openModal({content: "Could not rename the channel."})},
    );
    setRenamingId(null);
  };

  const confirmDelete = (index: number) => {
    const channel = channels[index];
    if (!channel) return;
    openModal({
      content: `Delete #${channel.name}? This removes its messages.`,
      options: [
        {label: "Delete", hotkey: "D", function: () => deleteChannel.mutate({workspaceId: workspace.id, channelId: channel.id})},
        {label: "Cancel", hotkey: "C", function: () => undefined},
      ],
    });
  };

  const confirmDeleteWorkspace = () => {
    if (deleteWorkspace.isPending) return;
    openModal({
      content: `Delete ${workspace.name}? This permanently removes all its channels, messages and chats.`,
      options: [
        {
          label: "Delete",
          hotkey: "D",
          function: () =>
            deleteWorkspace.mutate(workspace.id, {
              onSuccess: () => navigate("/workspaces"),
              onError: () => openModal({content: "Could not delete the workspace."}),
            }),
        },
        {label: "Cancel", hotkey: "C", function: () => undefined},
      ],
    });
  };

  const saveLogo = () => {
    if (!logo || updateLogo.isPending) return;
    updateLogo.mutate(
      {workspaceId: workspace.id, logo},
      {
        onSuccess: () => {
          setLogo(null);
          openModal({content: "Logo updated."});
        },
        onError: () => openModal({content: "Could not update the logo."}),
      },
    );
  };

  const {activeIndex} = useListNavigation({
    length: channels.length,
    target: channelsRef,
    enabled: renamingId === null,
    onSelect: (index) => beginRename(index),
  });

  useEffect(() => {
    if (renamingId) renameRef.current?.focus();
  }, [renamingId]);

  const channelKeysEnabled = isAdmin && renamingId === null && !isModalOpen && channels.length > 0;
  useHotkey("R", () => beginRename(activeIndex), {enabled: channelKeysEnabled});
  useHotkey("D", () => confirmDelete(activeIndex), {enabled: channelKeysEnabled});

  if (!isAdmin) {
    return <EmptyState title="Workspace settings" hint="Only owners and admins can manage this workspace."/>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2>Workspace settings</h2>
        <span className="muted">{workspace.name}</span>
      </header>

      <section className={styles.section}>
        <h3>Logo</h3>
        <div className={styles.logoRow}>
          <FileField label="Choose logo" hotkeyKey="L" file={logo} onChange={setLogo}/>
          <InlineHotkey hotkeyFunction={saveLogo} hotkeyKey="S" isBlocked={!logo || updateLogo.isPending}>
            {updateLogo.isPending ? "Saving..." : "Save"}
          </InlineHotkey>
        </div>
      </section>

      <section className={styles.section}>
        <h3>Channels</h3>
        <p className="muted">Select a channel, then <span className="primary">R</span> to rename or <span className="primary">D</span> to delete. Create channels from the sidebar.</p>
        <div ref={channelsRef} className={styles.list} tabIndex={0} aria-label="Channels">
          {channels.length === 0 && <p className="muted">No channels yet.</p>}
          {channels.map((channel, index) => (
            <div key={channel.id} className={`${styles.row} ${index === activeIndex ? styles.active : ""}`}>
              {renamingId === channel.id ? (
                <input
                  ref={renameRef}
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      commitRename();
                    } else if (event.key === "Escape") {
                      event.preventDefault();
                      setRenamingId(null);
                    }
                  }}
                />
              ) : (
                <>
                  <span className={styles.channelName}>#{channel.name}</span>
                  <span className={styles.rowActions}>
                    <button type="button" onClick={() => beginRename(index)}>Rename</button>
                    <button type="button" className="danger" onClick={() => confirmDelete(index)}>Delete</button>
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {isOwner && (
        <section className={styles.section}>
          <h3>Danger zone</h3>
          <p className="muted">Deleting the workspace is permanent and removes all of its channels, messages and chats.</p>
          <InlineHotkey hotkeyFunction={confirmDeleteWorkspace} hotkeyKey="X" isBlocked={deleteWorkspace.isPending} className="danger">
            {deleteWorkspace.isPending ? "Deleting..." : "Delete workspace"}
          </InlineHotkey>
        </section>
      )}
    </div>
  );
}

export default WorkspaceSettingsPage;
