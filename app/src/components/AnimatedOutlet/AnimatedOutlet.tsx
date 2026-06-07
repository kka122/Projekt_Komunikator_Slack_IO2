import {AnimatePresence} from "framer-motion";
import {cloneElement, type JSX} from "react";
import {useLocation, useOutlet} from "react-router";

const AnimatedOutlet = (): JSX.Element => {
  const location = useLocation();
  const element = useOutlet();

  return (
    <AnimatePresence mode="wait" initial={true}>
      {element && cloneElement(element, { key: location.pathname })}
    </AnimatePresence>
  );
};

export default AnimatedOutlet;