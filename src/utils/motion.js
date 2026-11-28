/**
 * Cenvora Precision Obsidian Motion System
 *
 * Bridges DESIGN.md operational speed (80ms-150ms) with Apple HIG physical
 * continuity: GPU-composited properties only (opacity, transform),
 * critically/near-critically damped springs (no playful bounce), and
 * full reduced-motion compatibility via <MotionConfig reducedMotion="user">.
 */

export const MOTION_DURATION = {
  instant: 0.08,    // 80ms  - tactile press, hover feedback
  fast: 0.12,       // 120ms - popovers, tooltips, list highlights, fade-in
  standard: 0.15,   // 150ms - modals, command palette, operational panels
  deliberate: 0.22, // 220ms - larger mobile drawers
};

export const MOTION_EASE = {
  // Deceleration curve for elements entering the interface
  out: [0.16, 1, 0.3, 1],
  // Acceleration curve for elements leaving the interface
  in: [0.4, 0, 1, 1],
  // Symmetric curve for stateful toggles and sidebar transitions
  inOut: [0.22, 1, 0.36, 1],
};

export const MOTION_SPRING = {
  // Crisp, zero-overshoot tactile response for small interactive surfaces
  responsive: {
    type: 'spring',
    stiffness: 550,
    damping: 38,
    mass: 0.7,
  },
  // Authoritative, critically-damped entrance for modals and dialogs
  modal: {
    type: 'spring',
    stiffness: 480,
    damping: 36,
    mass: 0.8,
  },
  // Weightier slide for full-height drawers
  drawer: {
    type: 'spring',
    stiffness: 420,
    damping: 38,
    mass: 0.9,
  },
};

export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.out },
  },
  exit: {
    opacity: 0,
    transition: { duration: MOTION_DURATION.instant, ease: MOTION_EASE.in },
  },
};

export const modalSurfaceVariants = {
  hidden: {
    opacity: 0,
    scale: 0.97,
    y: 8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: MOTION_SPRING.modal,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 4,
    transition: { duration: MOTION_DURATION.instant, ease: MOTION_EASE.in },
  },
};

export const commandPaletteVariants = {
  hidden: {
    opacity: 0,
    scale: 0.97,
    y: -6,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: MOTION_SPRING.responsive,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -4,
    transition: { duration: MOTION_DURATION.instant, ease: MOTION_EASE.in },
  },
};

export const popoverVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.out },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: MOTION_DURATION.instant, ease: MOTION_EASE.in },
  },
};
