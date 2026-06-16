import {type JSX} from "react";
import AnimatedOutlet from "../components/AnimatedOutlet/AnimatedOutlet.tsx";
import Modal from "../components/Modal/Modal.tsx";

/**
 * Top-level layout for every route. Mounts the global {@link Modal} once and
 * renders the active page through {@link AnimatedOutlet} so route changes
 * cross-fade.
 */
function Root(): JSX.Element {
  return <>
    <Modal/>
    <AnimatedOutlet/>
  </>
}

export default Root