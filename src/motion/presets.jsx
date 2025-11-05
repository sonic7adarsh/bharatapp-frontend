// Framer Motion presets for BharatApp
import { AnimatePresence, motion } from 'framer-motion'

export const fadePage = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const hoverLift = {
  whileHover: { y: -2, scale: 1.02 },
}

export const pressScale = {
  whileTap: { scale: 0.97 },
}

export const modalSlideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 16 },
}

export const skeletonShimmer = {
  animate: { opacity: [0.6, 1, 0.6] },
  transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
}

// Convenience wrapper components
export function PageFade({ children, className }) {
  return (
    <motion.div className={className} variants={fadePage} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  )
}

export function HoverLiftCard({ children, className }) {
  return (
    <motion.div className={className} whileHover={hoverLift.whileHover}>
      {children}
    </motion.div>
  )
}

export function PressScale({ children, className }) {
  return (
    <motion.div className={className} whileTap={pressScale.whileTap}>
      {children}
    </motion.div>
  )
}

export function ModalSlideUp({ isOpen, children, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div className="bg-white rounded-brand-lg shadow-elev-3 w-full max-w-lg mx-4"
            variants={modalSlideUp}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Drawer slide-in from right with overlay fade
export const drawerSlideIn = {
  initial: { x: 64 },
  animate: { x: 0 },
  exit: { x: 64 },
}

export function DrawerRight({ isOpen, children, onClose, widthClass = 'w-full sm:w-[380px]' }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end items-stretch bg-black/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`h-full bg-white shadow-elev-3 rounded-l-brand-lg ${widthClass}`}
            variants={drawerSlideIn}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}