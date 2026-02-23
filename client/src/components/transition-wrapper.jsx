import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Reusable Transition Wrapper for smooth opening/collapsing animations
 * 
 * Features:
 * - Height-based transition (0 -> auto)
 * - Opacity fade
 * - Cubic-bezier easing
 * - Overflow handling
 * - Reduced motion support
 * - GPU acceleration hints
 */
export default function TransitionWrapper({ 
  children, 
  className = "", 
  onAnimationComplete,
  id 
}) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    initial: { 
      opacity: 0, 
      height: 0,
      scale: 0.98,
      transformOrigin: "top center"
    },
    animate: { 
      opacity: 1, 
      height: "auto",
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.4,
        ease: [0.4, 0, 0.2, 1], // cubic-bezier(0.4, 0, 0.2, 1)
        opacity: { duration: 0.3, delay: 0.1 }, // Sync opacity with height
        height: { duration: 0.4 }
      }
    },
    exit: { 
      opacity: 0, 
      height: 0,
      scale: 0.98,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.3,
        ease: [0.4, 0, 0.2, 1],
        opacity: { duration: 0.2 },
        height: { duration: 0.3, delay: 0.05 }
      }
    }
  };

  return (
    <motion.div
      layout="position" // Helps with smooth layout changes
      key={id}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`overflow-hidden w-full ${className}`}
      onAnimationComplete={onAnimationComplete}
      style={{ 
        willChange: "opacity, height, transform",
        transform: "translate3d(0,0,0)" // Force GPU acceleration
      }}
    >
      {children}
    </motion.div>
  );
}
