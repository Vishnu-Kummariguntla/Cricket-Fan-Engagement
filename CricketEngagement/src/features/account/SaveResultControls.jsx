import { useState } from 'react'
import { useAuth } from './AuthProvider'

export default function SaveResultControls({
  buttonLabel = 'Save Result',
  disabled = false,
  getPayload,
  onSaved,
  type,
}) {
  const { saveUserResult, user } = useAuth()
  const [visibility, setVisibility] = useState('private')
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  const saveResult = async () => {
    if (disabled || saving) return
    setStatus('')
    setSaving(true)

    try {
      const saved = await saveUserResult(type, getPayload(), visibility)
      if (saved) {
        setStatus(`Saved to My Cricket Hub as ${visibility}.`)
        onSaved?.(saved)
      } else if (!user) {
        setStatus('Sign in or create an account to save this result.')
      }
    } catch (error) {
      setStatus(error?.code === 'permission-denied' ? 'Firestore blocked this save. Check published rules.' : 'Save failed. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="save-result-panel">
      <div className="save-result-panel-copy">
        <span>Save Progress</span>
        <strong>Keep this result in My Cricket Hub.</strong>
        <p>Choose privacy now. You can switch it later from your dashboard.</p>
      </div>
      <div className="save-visibility-toggle" aria-label="Saved result visibility">
        {['private', 'public'].map((option) => (
          <button
            className={visibility === option ? 'active' : ''}
            key={option}
            onClick={() => setVisibility(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
      <button className="save-result-button" disabled={disabled || saving} onClick={saveResult} type="button">
        {saving ? 'Saving...' : buttonLabel}
      </button>
      {status && <p className="save-result-status">{status}</p>}
    </div>
  )
}
