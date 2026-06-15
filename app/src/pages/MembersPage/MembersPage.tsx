import {type FormEvent, type JSX, useRef, useState} from "react";
import {useHotkey} from "@tanstack/react-hotkeys";
import {useShallow} from "zustand/react/shallow";
import {useWorkspace} from "../../layouts/workspaceContext.ts";
import {useAddMember, useRemoveMember, useUpdateMemberRole} from "../../data/workspaces.ts";
import {useUserSearch} from "../../data/user.ts";
import {useListNavigation} from "../../hooks/useListNavigation.ts";
import useModalStore from "../../store/useModalStore.ts";
import {UpdateUserRoleBodyRole} from "../../api/models";
import InlineHotkey from "../../components/InlineHotkey/InlineHotkey.tsx";
import Avatar from "../../components/Avatar/Avatar.tsx";
import Loader from "../../components/Loader/Loader.tsx";
import styles from "./MembersPage.module.css";

function MembersPage(): JSX.Element {
  const {workspace, currentUser, isOwner} = useWorkspace();
  const openModal = useModalStore(useShallow((state) => state.openModal));
  const isModalOpen = useModalStore((state) => state.isOpen);

  const addMember = useAddMember();
  const removeMember = useRemoveMember();
  const updateRole = useUpdateMemberRole();

  const listRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [emailInput, setEmailInput] = useState("");
  const [query, setQuery] = useState("");
  const search = useUserSearch(query);

  const members = workspace.users;

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

  const {activeIndex} = useListNavigation({
    length: members.length,
    target: listRef,
    onSelect: (index) => {
      const member = manageable(index);
      if (member) changeRole(member.id);
    },
  });

  useHotkey(
    "R",
    () => {
      const member = manageable(activeIndex);
      if (member) changeRole(member.id);
    },
    {enabled: isOwner && !isModalOpen},
  );
  useHotkey(
    "D",
    () => {
      const member = manageable(activeIndex);
      if (member) confirmRemove(member.id, `${member.name} ${member.surname}`);
    },
    {enabled: isOwner && !isModalOpen},
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2>Members</h2>
        <span className="muted">{members.length} in {workspace.name}</span>
      </header>

      <div ref={listRef} className={styles.list} tabIndex={0} aria-label="Members">
        {members.map((member, index) => (
          <div key={member.id} className={`${styles.row} ${index === activeIndex ? styles.active : ""}`}>
            <Avatar user={member}/>
            <span className={styles.info}>
              <span className={styles.name}>
                {member.name} {member.surname}
                {member.id === currentUser.id && <span className="muted"> (you)</span>}
              </span>
              <span className={styles.email}>{member.email}</span>
            </span>
            {isOwner && member.id !== currentUser.id && (
              <span className={styles.rowActions}>
                <button type="button" onClick={() => changeRole(member.id)}>Role</button>
                <button type="button" className="danger" onClick={() => confirmRemove(member.id, `${member.name} ${member.surname}`)}>Drop</button>
              </span>
            )}
          </div>
        ))}
      </div>

      {isOwner ? (
        <section className={styles.invite}>
          <form onSubmit={runSearch} className={styles.inviteForm}>
            <InlineHotkey hotkeyFunction={() => emailRef.current?.focus()} hotkeyKey="A">Add by email</InlineHotkey>
            <input
              ref={emailRef}
              value={emailInput}
              placeholder="name@example.com — Enter to search"
              onChange={(event) => setEmailInput(event.target.value)}
            />
          </form>

          {search.isFetching && <Loader label="searching"/>}
          {query.length > 0 && !search.isFetching && (search.data?.length ?? 0) === 0 && (
            <p className="muted">No users matched “{query}”.</p>
          )}
          <div className={styles.results}>
            {search.data?.map((user) => (
              <button key={user.id} type="button" className={styles.result} onClick={() => add(user.id)}>
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
    </div>
  );
}

export default MembersPage;
