import { AnimatePresence, motion } from 'framer-motion'

export default function LoadingScreen({ visible }) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="loading-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <div className="loading-inner">
            <div className="loading-spinner" aria-hidden="true" />
            <div>
              <strong>Preparing the stadium</strong>
              <p>One moment while the IPL arena and timeline experience load.</p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
