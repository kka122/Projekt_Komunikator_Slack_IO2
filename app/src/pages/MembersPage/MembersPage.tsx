import {type FormEvent, type JSX, useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router";
import {useShallow} from "zustand/react/shallow";
import {useWorkspace} from "../../layouts/workspaceContext.ts";
import {useAddMember, useRemoveMember, useUpdateMemberRole} from "../../data/workspaces.ts";
import {useStartDirectChat} from "../../data/messaging.ts";
import {useUserSearch} from "../../data/user.ts";
import {useListNavigation} from "../../hooks/useListNavigation.ts";
import useModalStore from "../../store/useModalStore.ts";
import {UpdateUserRoleBodyRole} from "../../api/models";
import InlineHotkey from "../../components/InlineHotkey/InlineHotkey.tsx";
import HintBar from "../../components/HintBar/HintBar.tsx";
import Avatar from "../../components/Avatar/Avatar.tsx";
import Loader from "../../components/Loader/Loader.tsx";
import styles from "./MembersPage.module.css";

/**
 * Workspace members screen (`members`). Lists members with keyboard navigation;
 * the owner can change a member's role (`R`), remove a member (`D`) and invite
 * new users by searching email (`A`). Non-owners see a read-only roster.
 */
function MembersPage(): JSX.Element {
  const {workspace, currentUser, isOwner} = useWorkspace();
  const navigate = useNavigate();
  const openModal = useModalStore(useShallow((state) => state.openModal));

  const addMember = useAddMember();
  const removeMember = useRemoveMember();
  const updateRole = useUpdateMemberRole();
  const startDirectChat = useStartDirectChat();

  const listRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [query, setQuery] = useState("");
  const search = useUserSearch(query);
  const results = search.data ?? [];

  const filterText = filter.trim().toLowerCase();
  const members = workspace.users.filter((member) =>
    `${member.name} ${member.surname} ${member.email}`.toLowerCase().includes(filterText),
  );

  const manageable = (index: number) => {
    const member = members[index];
    return isOwner && member && member.id !== currentUser.id ? member : null;
  };

  const changeRole = (userId: string) => {
    openModal({
      content: "Set role",
      options: [
        {
          label: "Admin",
          hotkey: "A",
          function: () =>
            updateRole.mutate({userId, workspaceId: workspace.id, role: UpdateUserRoleBodyRole.admin}),
        },
        {
          label: "Member",
          hotkey: "M",
          function: () =>
            updateRole.mutate({userId, workspaceId: workspace.id, role: UpdateUserRoleBodyRole.member}),
        },
      ],
    });
  };

  const confirmRemove = (userId: string, label: string) => {
    openModal({
      content: `Remove ${label} from the workspace?`,
      options: [
        {label: "Remove", hotkey: "R", function: () => removeMember.mutate({userId, workspaceId: workspace.id})},
        {label: "Cancel", hotkey: "C", function: () => undefined},
      ],
    });
  };

  const messageUser = (userId: string) => {
    if (userId === currentUser.id || startDirectChat.isPending) return;
    startDirectChat.mutate(
      {workspaceId: workspace.id, userId},
      {
        onSuccess: (directChatId) => navigate(`/workspaces/${workspace.id}/dms/${directChatId}`),
        onError: () => openModal({content: "Could not open the chat."}),
      },
    );
  };

  const add = (userId: string) => {
    addMember.mutate(
      {userId, workspaceId: workspace.id},
      {
        onSuccess: () => openModal({content: "Member added."}),
        onError: () => openModal({content: "Could not add that user."}),
      },
    );
  };

  const runSearch = (event?: FormEvent) => {
    event?.preventDefault();
    setQuery(emailInput.trim());
  };

  // Focus the list on mount so arrow keys work immediately — the list hotkeys
  // only fire while focus is inside it.
  useEffect(() => {
    listRef.current?.focus();
  }, []);

  const {activeIndex} = useListNavigation({
    length: members.length,
    target: listRef,
    onSelect: (index) => {
      const member = manageable(index);
      if (member) changeRole(member.id);
    },
  });

  // Keyboard navigation over the email-search results: arrows + Enter to add.
  const {activeIndex: resultIndex} = useListNavigation({
    length: results.length,
    target: resultsRef,
    onSelect: (index) => {
      const user = results[index];
      if (user) add(user.id);
    },
  });

  // Move focus into the results once a search returns matches.
  useEffect(() => {
    if (results.length > 0) resultsRef.current?.focus();
  }, [results.length]);

  // Act on the keyboard-selected member; bound via the HintBar's InlineHotkeys.
  const messageActive = () => {
    const member = members[activeIndex];
    if (member && member.id !== currentUser.id) messageUser(member.id);
  };
  const roleActive = () => {
    const member = manageable(activeIndex);
    if (member) changeRole(member.id);
  };
  const dropActive = () => {
    const member = manageable(activeIndex);
    if (member) confirmRemove(member.id, `${member.name} ${member.surname}`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2>Members</h2>
        <span className="muted">
          {filterText ? `${members.length} of ${workspace.users.length}` : members.length} in {workspace.name}
        </span>
      </header>

      <div className={styles.filter}>
        <InlineHotkey hotkeyFunction={() => filterRef.current?.focus()} hotkeyKey="F">Filter</InlineHotkey>
        <input
          ref={filterRef}
          value={filter}
          placeholder="filter members…"
          onChange={(event) => setFilter(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setFilter("");
              listRef.current?.focus();
            } else if (event.key === "ArrowDown" || event.key === "Enter") {
              event.preventDefault();
              listRef.current?.focus();
            }
          }}
        />
      </div>

      <div ref={listRef} className={styles.list} tabIndex={0} aria-label="Members">
        {members.length === 0 && <p className="muted">No members match “{filter}”.</p>}
        {members.map((member, index) => (
          <div key={member.id} className={`${styles.row} ${index === activeIndex ? styles.active : ""}`}>
            <Avatar user={member}/>
            <span className={styles.info}>
              <span className={styles.name}>
                {member.name} {member.surname}
                {member.id === currentUser.id && <span className="muted"> (you)</span>}
                {member.workspaceRole && (
                  <span className={styles.role}>{member.workspaceRole}</span>
                )}
              </span>
              <span className={styles.email}>{member.email}</span>
            </span>
            {member.id !== currentUser.id && (
              <span className={styles.rowActions}>
                <button type="button" onClick={() => messageUser(member.id)}>Message</button>
                {isOwner && (
                  <>
                    <button type="button" onClick={() => changeRole(member.id)}>Role</button>
                    <button type="button" className="danger" onClick={() => confirmRemove(member.id, `${member.name} ${member.surname}`)}>Drop</button>
                  </>
                )}
              </span>
            )}
          </div>
        ))}
      </div>

      {isOwner ? (
        <section className={styles.invite}>
          <form onSubmit={runSearch} className={styles.inviteForm}>
            <span className="muted">Add by email</span>
            <input
              ref={emailRef}
              value={emailInput}
              placeholder="name@example.com — Enter to search"
              onChange={(event) => setEmailInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" && results.length > 0) {
                  event.preventDefault();
                  resultsRef.current?.focus();
                }
              }}
            />
          </form>

          {search.isFetching && <Loader label="searching"/>}
          {query.length > 0 && !search.isFetching && (search.data?.length ?? 0) === 0 && (
            <p className="muted">No users matched “{query}”.</p>
          )}
          <div ref={resultsRef} className={styles.results} tabIndex={results.length > 0 ? 0 : -1} aria-label="Search results">
            {results.map((user, index) => (
              <button key={user.id} type="button" className={`${styles.result} ${index === resultIndex ? styles.active : ""}`} onClick={() => add(user.id)}>
                <Avatar user={user} size={26}/>
                <span>{user.name} {user.surname}</span>
                <span className="muted">{user.email}</span>
                <span className="primary">add</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <p className={`muted ${styles.note}`}>Only the workspace owner can manage members.</p>
      )}

      <HintBar contained>
        <InlineHotkey hotkeyFunction={messageActive} hotkeyKey="M">Message</InlineHotkey>
        {isOwner && <InlineHotkey hotkeyFunction={roleActive} hotkeyKey="R">Role</InlineHotkey>}
        {isOwner && <InlineHotkey hotkeyFunction={dropActive} hotkeyKey="D">Drop</InlineHotkey>}
        {isOwner && <InlineHotkey hotkeyFunction={() => emailRef.current?.focus()} hotkeyKey="A">Add user</InlineHotkey>}
      </HintBar>
    </div>
  );
}

export default MembersPage;
