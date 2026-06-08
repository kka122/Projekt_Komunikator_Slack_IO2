import {type JSX} from "react";
import {type HTMLMotionProps, motion} from "framer-motion";
import styles from "./AnimatedMain.module.css";

const variants = {
  initial: {opacity: 0},
  animate: {opacity: 1},
  exit: {opacity: 0},
}

type AnimatedMainProps = HTMLMotionProps<"main">

function AnimatedMain({children, className, ...props}: AnimatedMainProps): JSX.Element {
  return <motion.main {...props}
                      className={`${styles.main} ${className ?? ""}`}
                      variants={variants}
                      initial="initial"
                      animate="animate"
                      exit={"exit"}
                      transition={{duration: 0.1, ease: "easeInOut"}}
  >
    {children}
  </motion.main>
}

export default AnimatedMain;