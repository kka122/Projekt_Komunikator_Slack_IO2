import {type JSX, useEffect, useMemo} from "react";
import {Outlet, useNavigate, useParams} from "react-router";
import {motion} from "framer-motion";
import {useShallow} from "zustand/react/shallow";
import useUserStore from "../store/useUserStore.ts";
import {useWorkspaces} from "../data/workspaces.ts";
import {WorkspaceUserRole} from "../api/models";
import AnimatedMain from "../components/AnimatedMain/AnimatedMain.tsx";
import Sidebar from "../components/Sidebar/Sidebar.tsx";
import Loader from "../components/Loader/Loader.tsx";
import WorkspaceContext, {type WorkspaceContextValue} from "./workspaceContext.ts";
import styles from "./WorkspaceLayout.module.css";

/** Fade variants for the workspace shell. */
const variants = {
  initial: {opacity: 0},
  animate: {opacity: 1},
  exit: {opacity: 0},
};

/**
 * Layout for `workspaces/:workspaceId`. Resolves the workspace from the
 * `:workspaceId` param against the cached list, derives the caller's role
 * (owner/admin) and provides both via {@link WorkspaceContext} to nested
 * screens. Renders the {@link Sidebar} plus an `<Outlet>` for the active
 * channel/DM/page. Shows a loader while workspaces load and redirects to
 * `/workspaces` when the id is unknown.
 */
function WorkspaceLayout(): JSX.Element {
  const {workspaceId} = useParams();
  const navigate = useNavigate();
  const {data: workspaces, isLoading, isError} = useWorkspaces();
  const currentUser = useUserStore(useShallow((state) => state.user));

  const workspace = useMemo(
    () => workspaces?.find((item) => item.id === workspaceId),
    [workspaces, workspaceId],
  );

  const value = useMemo<WorkspaceContextValue | null>(() => {
    if (!workspace || !currentUser) return null;
    return {
      workspace,
      currentUser,
      isOwner: workspace.userRole === WorkspaceUserRole.owner,
      isAdmin:
        workspace.userRole === WorkspaceUserRole.owner ||
        workspace.userRole === WorkspaceUserRole.admin,
    };
  }, [workspace, currentUser]);

  // Workspace vanished (deleted, or unknown id) — leave for the picker. Done in
  // an effect, not by returning a bare <Navigate>: that renders null, and a null
  // keyed child strands AnimatePresence's mode="wait" exit and blanks the screen.
  const missing = !isLoading && !!currentUser && (isError || !workspace || !value);
  useEffect(() => {
    if (missing) navigate("/workspaces", {replace: true});
  }, [missing, navigate]);

  // Always render a motion root (even while loading/redirecting) so the outlet
  // transition can complete instead of getting stuck on a null child.
  if (isLoading || !currentUser || missing) {
    return (
      <AnimatedMain className={styles.fallback}>
        <Loader label="opening workspace"/>
      </AnimatedMain>
    );
  }

  return (
    <WorkspaceContext.Provider value={value}>
      <motion.div
        className={styles.shell}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{duration: 0.15}}
      >
        <Sidebar/>
        <section className={styles.main}>
          <Outlet/>
        </section>
      </motion.div>
    </WorkspaceContext.Provider>
  );
}

export default WorkspaceLayout;
