import {type JSX, useRef, useState} from "react";
import {useNavigate} from "react-router";
import {useShallow} from "zustand/react/shallow";
import AnimatedMain from "../../components/AnimatedMain/AnimatedMain.tsx";
import InlineHotkey from "../../components/InlineHotkey/InlineHotkey.tsx";
import HintBar from "../../components/HintBar/HintBar.tsx";
import Loader from "../../components/Loader/Loader.tsx";
import CreateWorkspacePanel from "../../components/CreateWorkspacePanel/CreateWorkspacePanel.tsx";
import {useWorkspaces} from "../../data/workspaces.ts";
import {useLogout} from "../../data/auth.ts";
import {useListNavigation} from "../../hooks/useListNavigation.ts";
import useModalStore from "../../store/useModalStore.ts";
import type {Workspace} from "../../api/models";
import {resolveAssetUrl} from "../../config/api.ts";
import styles from "./WorkspacesPage.module.css";

function WorkspacesPage(): JSX.Element {
  const navigate = useNavigate();
  const openModal = useModalStore(useShallow((state) => state.openModal));
  const {data, isLoading, isError} = useWorkspaces();
  const logout = useLogout();

  const [creating, setCreating] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const workspaces = data ?? [];

  const open = (workspace: Workspace) => {
    navigate(`/workspaces/${workspace.id}`);
  };

  const {activeIndex, setActiveIndex} = useListNavigation({
    length: workspaces.length,
    target: listRef,
    enabled: !creating,
    onSelect: (index) => open(workspaces[index]),
  });

  function confirmLogout() {
    openModal({
      content: "Log out of Szponcik?",
      options: [
        {label: "Logout", hotkey: "L", function: () => logout.mutate(undefined, {onSettled: () => navigate("/auth/login")})},
        {label: "Cancel", hotkey: "C", function: () => undefined},
      ],
    });
  }

  return (
    <AnimatedMain className={styles.page}>
      <h2>Your workspaces</h2>

      {creating ? (
        <CreateWorkspacePanel onDone={() => setCreating(false)} onCancel={() => setCreating(false)}/>
      ) : (
        <>
          <div ref={listRef} className={styles.list} tabIndex={0} aria-label="Workspaces">
            {isLoading && <Loader label="loading workspaces"/>}
            {isError && <p className="muted">Could not load workspaces.</p>}
            {!isLoading && !isError && workspaces.length === 0 && (
              <p className="muted">No workspaces yet. Press <span className="primary">C</span> to create one.</p>
            )}
            {workspaces.map((workspace, index) => (
              <WorkspaceRow
                key={workspace.id}
                workspace={workspace}
                active={index === activeIndex}
                onClick={() => {
                  setActiveIndex(index);
                  open(workspace);
                }}
              />
            ))}
          </div>

          <HintBar>
            <InlineHotkey hotkeyFunction={() => setCreating(true)} hotkeyKey="C">Create workspace</InlineHotkey>
            <InlineHotkey hotkeyFunction={() => navigate("/settings")} hotkeyKey="P">Profile</InlineHotkey>
            <InlineHotkey hotkeyFunction={confirmLogout} hotkeyKey="Q">Quit</InlineHotkey>
            <InlineHotkey hotkeyFunction={() => navigate("/")} hotkeyKey="H">Home</InlineHotkey>
          </HintBar>
        </>
      )}
    </AnimatedMain>
  );
}

interface WorkspaceRowProps {
  workspace: Workspace;
  active: boolean;
  onClick: () => void;
}

function WorkspaceRow({workspace, active, onClick}: WorkspaceRowProps): JSX.Element {
  const [broken, setBroken] = useState(false);
  const showLogo = workspace.logoUrl && !broken;

  return (
    <button type="button" className={`${styles.row} ${active ? styles.active : ""}`} onClick={onClick}>
      <span className={styles.logo}>
        {showLogo ? (
          <img src={resolveAssetUrl(workspace.logoUrl)} alt="" onError={() => setBroken(true)}/>
        ) : (
          workspace.name.charAt(0).toUpperCase()
        )}
      </span>
      <span className={styles.info}>
        <span className={styles.name}>{workspace.name}</span>
        <span className={styles.meta}>
          {workspace.userRole} · {workspace.channels.length} channels · {workspace.users.length} members
        </span>
      </span>
    </button>
  );
}

export default WorkspacesPage;
