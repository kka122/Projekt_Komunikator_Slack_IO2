import {createContext, useContext} from "react";
import type {User, Workspace} from "../api/models";

/** Value provided by {@link WorkspaceContext} to all workspace-scoped screens. */
export interface WorkspaceContextValue {
  /** The active workspace (with embedded channels and members). */
  workspace: Workspace;
  /** The signed-in user. */
  currentUser: User;
  /** owner or admin — may manage channels, members and workspace settings. */
  isAdmin: boolean;
  /** True only for the workspace owner (superset of admin powers). */
  isOwner: boolean;
}

/** Context holding the resolved workspace + the caller's role within it. */
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

/**
 * Read the active {@link WorkspaceContextValue}.
 *
 * @throws Error if used outside a `WorkspaceLayout` provider.
 */
export function useWorkspace(): WorkspaceContextValue {
  const value = useContext(WorkspaceContext);
  if (!value) {
    throw new Error("useWorkspace must be used inside a WorkspaceLayout");
  }
  return value;
}

export default WorkspaceContext;
