import {AnimatePresence} from "framer-motion";
import {cloneElement, type JSX} from "react";
import {useLocation, useOutlet} from "react-router";

// Key the transition by the first two path segments instead of the full path.
// That way switching channels inside `/workspaces/:id/...` keeps the workspace
// shell mounted (no sidebar/data reload), while moving between top-level areas
// (landing, auth, a different workspace) still animates as a fresh page.
function transitionKey(pathname: string): string {
  return "/" + pathname.split("/").filter(Boolean).slice(0, 2).join("/");
}

const AnimatedOutlet = (): JSX.Element => {
  const location = useLocation();
  const element = useOutlet();

  return (
    <AnimatePresence mode="wait" initial={true}>
      {element && cloneElement(element, {key: transitionKey(location.pathname)})}
    </AnimatePresence>
  );
};

export default AnimatedOutlet;
