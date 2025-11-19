// Framer Motion presets for BharatApp
import React, { useEffect, useRef } from 'react'
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

export function HoverLiftCard({ children, className, ...props }) {
  return (
    <motion.div className={className} whileHover={hoverLift.whileHover} {...props}>
      {children}
    </motion.div>
  )
}

export function PressScale({ children, className, ...props }) {
  return (
    <motion.div className={className} whileTap={pressScale.whileTap} {...props}>
      {children}
    </motion.div>
  )
}

export function ModalSlideUp({ isOpen, children, onClose, ariaLabel = 'Dialog' }) {
  const dialogRef = useRef(null)
  const restoreFocusRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    // Save previously focused element to restore on close
    restoreFocusRef.current = document.activeElement

    const el = dialogRef.current
    // Focus the dialog container for screen readers and keyboard users
    if (el) el.focus()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        // Close on Escape for better accessibility
        onClose?.()
      } else if (e.key === 'Tab') {
        // Simple focus trap within the dialog
        const root = dialogRef.current
        if (!root) return
        const focusables = root.querySelectorAll(
          'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'
        )
        const list = Array.from(focusables).filter((node) => {
          const style = window.getComputedStyle(node)
          const isHidden = style.visibility === 'hidden' || style.display === 'none'
          const rect = node.getBoundingClientRect()
          return !isHidden && rect.width > 0 && rect.height > 0
        })
        if (list.length === 0) {
          e.preventDefault()
          root.focus()
          return
        }
        const first = list[0]
        const last = list[list.length - 1]
        const active = document.activeElement
        if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        } else if (e.shiftKey && active === first) {
          e.preventDefault()
          last.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      // Restore previous focus
      const restore = restoreFocusRef.current
      if (restore && typeof restore.focus === 'function') {
        try { restore.focus() } catch {}
      }
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            tabIndex={-1}
            className="bg-white rounded-brand-lg shadow-elev-3 w-full max-w-lg mx-4"
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

export function DrawerRight({ isOpen, children, onClose, widthClass = 'w-full sm:w-[380px]', ariaLabel = 'Drawer', id }) {
  const drawerRef = useRef(null)
  const restoreFocusRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    restoreFocusRef.current = document.activeElement
    const el = drawerRef.current
    if (el) el.focus()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      } else if (e.key === 'Tab') {
        const root = drawerRef.current
        if (!root) return
        const focusables = root.querySelectorAll(
          'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'
        )
        const list = Array.from(focusables).filter((node) => {
          const style = window.getComputedStyle(node)
          const isHidden = style.visibility === 'hidden' || style.display === 'none'
          const rect = node.getBoundingClientRect()
          return !isHidden && rect.width > 0 && rect.height > 0
        })
        if (list.length === 0) {
          e.preventDefault()
          root.focus()
          return
        }
        const first = list[0]
        const last = list[list.length - 1]
        const active = document.activeElement
        if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        } else if (e.shiftKey && active === first) {
          e.preventDefault()
          last.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      const restore = restoreFocusRef.current
      if (restore && typeof restore.focus === 'function') {
        try { restore.focus() } catch {}
      }
    }
  }, [isOpen, onClose])

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
            ref={drawerRef}
            id={id}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            tabIndex={-1}
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