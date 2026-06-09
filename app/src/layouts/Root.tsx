import {type JSX} from "react";
import AnimatedOutlet from "../components/AnimatedOutlet/AnimatedOutlet.tsx";
import Modal from "../components/Modal/Modal.tsx";

function Root(): JSX.Element {
  return <>
    <Modal/>
    <AnimatedOutlet/>
  </>
}

export default Root