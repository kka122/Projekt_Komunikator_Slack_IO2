import {type JSX} from "react";
import {useWorkspace} from "../../layouts/workspaceContext.ts";
import EmptyState from "../../components/EmptyState/EmptyState.tsx";

function WorkspaceHome(): JSX.Element {
  const {workspace} = useWorkspace();
  const hint =
    workspace.channels.length > 0
      ? "Press / to search, then ↑ ↓ and Enter to open a channel."
      : "No channels yet. Press C in the sidebar to create the first one.";

  return <EmptyState title={`Welcome to ${workspace.name}`} hint={hint}/>;
}

export default WorkspaceHome;
