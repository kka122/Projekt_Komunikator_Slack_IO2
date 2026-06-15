import {createContext, useContext} from "react";
import type {User, Workspace} from "../api/models";

export interface WorkspaceContextValue {
  workspace: Workspace;
  currentUser: User;
  /** owner or admin — may manage channels, members and workspace settings. */
  isAdmin: boolean;
  isOwner: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace(): WorkspaceContextValue {
  const value = useContext(WorkspaceContext);
  if (!value) {
    throw new Error("useWorkspace must be used inside a WorkspaceLayout");
  }
  return value;
}

export default WorkspaceContext;
