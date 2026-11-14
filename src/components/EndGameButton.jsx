import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useT } from '../i18n'
import './EndGameButton.css'

// "End game" for games that remember a running match (Adventure, Quiz Race,
// Snakes & Ladders): asks once, then goes back to that game's start screen.
export default function EndGameButton({ onEnd, disabled = false, className = '' }) {
  const [ask, setAsk] = useState(false)
  const t = useT()
  return (
    <>
      <button
        className={`end-game-btn ${className}`}
        onClick={() => setAsk(true)}
        disabled={disabled}
        title={t('End game')}
      >
        ✖ {t('End game')}
      </button>
      {ask && createPortal(
        <div className="end-game-overlay" onClick={() => setAsk(false)}>
          <div className="end-game-panel" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <div className="end-game-emoji">🏁</div>
            <h3>{t('End this game?')}</h3>
            <p>{t('You go back to the start and can choose the players again.')}</p>
            <div className="end-game-btns">
              <button className="btn btn-primary" onClick={() => setAsk(false)}>{t('Keep playing')}</button>
              <button className="btn btn-secondary" onClick={() => { setAsk(false); onEnd() }}>{t('End game')}</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
