import {AnimatePresence} from "framer-motion";
import {cloneElement, type JSX} from "react";
import {useLocation, useOutlet} from "react-router";

/**
 * Derive the transition key from the first two path segments instead of the
 * full path. Switching channels inside `/workspaces/:id/...` keeps the same key
 * (so the workspace shell stays mounted — no sidebar/data reload), while moving
 * between top-level areas (landing, auth, a different workspace) yields a new
 * key and animates as a fresh page.
 *
 * @param pathname - The current location pathname.
 * @returns A `/seg1/seg2` key.
 */
function transitionKey(pathname: string): string {
  return "/" + pathname.split("/").filter(Boolean).slice(0, 2).join("/");
}

/**
 * Renders the active route element inside framer-motion's `AnimatePresence` so
 * page changes cross-fade. The element is re-keyed by {@link transitionKey} to
 * control when a transition actually fires.
 */
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
