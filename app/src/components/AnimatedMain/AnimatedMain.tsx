import {type JSX} from "react";
import {type HTMLMotionProps, motion} from "framer-motion";
import styles from "./AnimatedMain.module.css";

/** Fade-in/out opacity variants applied to the `<main>` element. */
const variants = {
  initial: {opacity: 0},
  animate: {opacity: 1},
  exit: {opacity: 0},
}

/** Props for {@link AnimatedMain}: all motion `<main>` props (children, className, …). */
type AnimatedMainProps = HTMLMotionProps<"main">

/**
 * Animated `<main>` wrapper used as the top element of full-page screens. Fades
 * in on mount and out on exit (paired with framer-motion's `AnimatePresence` in
 * {@link AnimatedOutlet}). Extra `className` is merged with the base style.
 */
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