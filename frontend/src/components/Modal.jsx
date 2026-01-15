import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

function Modal({ isOpen, onClose, title, children }) {
  const modalRef = useRef(null)
  const previousFocusRef = useRef(null)

  // Close modal on Escape key and manage focus
  useEffect(() => {
    if (!isOpen) return

    // Store the previously focused element
    previousFocusRef.current = document.activeElement

    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    
    // Focus the modal when it opens
    if (modalRef.current) {
      modalRef.current.focus()
    }

    // Prevent body scroll when modal is open
    if (isOpen) {
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
      document.body.classList.add('modal-open')
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      document.body.classList.remove('modal-open')
      
      // Restore focus to the previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-card-white rounded-custom shadow-custom w-full max-w-2xl max-h-[90vh] overflow-y-auto my-auto focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
          <h2 id="modal-title" className="text-lg sm:text-xl font-semibold text-text-dark">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-dark transition-colors p-1 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-primary-blue flex-shrink-0"
            aria-label="Close modal"
          >
            <X size={20} className="sm:size-6" />
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  )
}

export default Modal
