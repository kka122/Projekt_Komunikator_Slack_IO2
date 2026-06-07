import {type JSX} from "react";
import {type HTMLMotionProps, motion} from "framer-motion";

const variants = {
  initial: {opacity: 0},
  animate: {opacity: 1},
  exit: {opacity: 0},
}

type AnimatedMainProps = HTMLMotionProps<"main">

function AnimatedMain({children, ...props}: AnimatedMainProps): JSX.Element {
  return <motion.main {...props}
                      variants={variants}
                      initial="initial"
                      animate="animate"
                      exit={"exit"}
                      transition={{duration: 0.3, ease: "easeInOut"}}
  >
    {children}
  </motion.main>
}

export default AnimatedMain;