// Shared keyboard utilities for roving tabindex and radiogroup navigation

export const isNavKey = (key) => (
  key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown' || key === 'Home' || key === 'End'
)

export const nextIndexForKey = (currentIndex, length, key) => {
  if (!isNavKey(key)) return currentIndex
  if (key === 'Home') return 0
  if (key === 'End') return length - 1
  const prev = key === 'ArrowLeft' || key === 'ArrowUp'
  const next = key === 'ArrowRight' || key === 'ArrowDown'
  if (prev) return (currentIndex - 1 + length) % length
  if (next) return (currentIndex + 1) % length
  return currentIndex
}