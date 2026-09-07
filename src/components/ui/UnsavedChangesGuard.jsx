import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'
import ConfirmDialog from './ConfirmDialog'

/**
 * Stops half-finished work disappearing without a word.
 *
 * Covers both ways out: clicking a sidebar link or Cancel (handled by the
 * router's blocker) and refreshing or closing the tab (handled by the browser's
 * own prompt). Only asks when something has actually been typed.
 */
export default function UnsavedChangesGuard({ when, message }) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => when && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!when) return undefined
    const onBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [when])

  return (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      title="Leave without saving?"
      message={message || 'You have started filling this in. If you leave now, nothing will be saved.'}
      confirmLabel="Yes, leave without saving"
      cancelLabel="No, stay here"
      onConfirm={() => blocker.proceed && blocker.proceed()}
      onCancel={() => blocker.reset && blocker.reset()}
    />
  )
}
