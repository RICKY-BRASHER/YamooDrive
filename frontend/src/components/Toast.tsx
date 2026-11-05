import { AnimatePresence, motion } from 'framer-motion'
import { Check, X } from 'lucide-react'

type ToastProps = {
  message: string
  onClose: () => void
}

function Toast({ message, onClose }: ToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="yamoo-toast"
          role="status"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={{ duration: 0.22 }}
        >
          <span className="toast-icon"><Check size={15} /></span>
          {message}
          <button type="button" onClick={onClose} aria-label="Fermer"><X size={15} /></button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Toast
