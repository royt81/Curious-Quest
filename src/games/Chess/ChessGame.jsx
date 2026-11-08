import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import {
  WHITE, BLACK, SIZE,
  makeInitialBoard, applyMove, legalMovesForPiece,
  gameStatus, inCheck, enPassantTargetAfter, pickAIMove,
  findKing, PIECE_IMG, NAME,
} from './chessEngine'
import './Chess.css'
import { playMove, playCapture, playWin } from '../../sound/sfx'

const AI_DELAY = 650

const gameoverVariants = {
  initial: { opacity: 0, scale: 0.85, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
}

export default function ChessGame({ onBack }) {
  const { theme } = useTheme()

  const [phase, setPhase] = useState('setup')     // 'setup' | 'playing'
  const [mode,  setMode]  = useState('cpu')        // 'cpu' | 'friends'

  const [board, setBoard] = useState(makeInitialBoard)
  const [turn,  setTurn]  = useState(WHITE)
  const [enPassant, setEnPassant] = useState(null)
  const [selected, setSelected]   = useState(null)
  const [gameOver, setGameOver]   = useState(false)
  const [winner, setWinner]       = useState(null) // WHITE | BLACK | 'draw'
  const [endKind, setEndKind]     = useState(null) // 'checkmate' | 'stalemate'
  const [aiThinking, setAiThinking] = useState(false)
  const [log, setLog] = useState([])

  const aiTimer = useRef(null)
  const stateRef = useRef({})
  stateRef.current = { board, turn, enPassant, gameOver }

  const addLog = (msg) => setLog(prev => [msg, ...prev].slice(0, 5))

  const p1Label = mode === 'cpu' ? 'You' : 'Player 1'
  const p2Label = mode === 'cpu' ? 'Computer' : 'Player 2'

  const startGame = () => {
    if (aiTimer.current) { clearTimeout(aiTimer.current); aiTimer.current = null }
    setBoard(makeInitialBoard())
    setTurn(WHITE); setEnPassant(null); setSelected(null)
    setGameOver(false); setWinner(null); setEndKind(null); setAiThinking(false)
    setLog(mode === 'cpu'
      ? ['Your move! White goes first — tap a piece.']
      : ['♙ Player 1 (White) — tap a piece.'])
    setPhase('playing')
  }

  const restart = () => setPhase('setup')

  // side a human controls right now
  const humanSide = mode === 'friends' ? turn : WHITE

  const legalForSelected = selected
    ? legalMovesForPiece(board, selected[0], selected[1], turn, enPassant)
    : []
  const isDest = (r, c) => legalForSelected.some(m => m.to[0] === r && m.to[1] === c)

  const finishTurn = (resBoard, mover, move) => {
    const ep = enPassantTargetAfter(move)
    setEnPassant(ep)
    const nextSide = mover === WHITE ? BLACK : WHITE
    const status = gameStatus(resBoard, nextSide, ep)
    if (status === 'checkmate') {
      playWin()
      setGameOver(true); setWinner(mover); setEndKind('checkmate')
      addLog(`Checkmate! ${mover === WHITE ? p1Label : p2Label} wins! 🏆`)
      return
    }
    if (status === 'stalemate' || status === 'insufficient') {
      setGameOver(true); setWinner('draw'); setEndKind(status)
      addLog(status === 'stalemate' ? 'Stalemate — it\'s a draw! 🤝' : 'Not enough pieces left to checkmate — it\'s a draw! 🤝')
      return
    }
    if (inCheck(resBoard, nextSide)) addLog('Check! 👑')
    setTurn(nextSide)
  }

  const doMove = (move) => {
    const mover = turn
    const res = applyMove(board, move)
    if (res.captured) playCapture(); else playMove()
    setBoard(res.board)
    setSelected(null)

    const who = mover === WHITE ? p1Label : p2Label
    const tag = mover === WHITE ? '♙' : '♟'
    if (res.castle) addLog(`${tag} ${who} castled! 🏰`)
    else if (res.promoted) addLog(`${tag} ${who} promoted a Pawn to Queen! 👑`)
    else if (res.captured) addLog(`${tag} ${who} captured a piece! 💥`)

    finishTurn(res.board, mover, move)
  }

  // ── human interaction ──
  const handleSquare = (r, c) => {
    const isHumanTurn = mode === 'cpu' ? turn === WHITE : true
    if (!isHumanTurn || gameOver || aiThinking) return
    const cell = board[r][c]

    if (selected) {
      const move = legalForSelected.find(m => m.to[0] === r && m.to[1] === c)
      if (move) return doMove(move)
      if (cell && cell.side === humanSide) { setSelected([r, c]); return }
      setSelected(null)
      return
    }
    if (cell && cell.side === humanSide) setSelected([r, c])
  }

  // ── AI turn (cpu mode) ──
  const runAI = () => {
    const { board: b, enPassant: ep, gameOver: go } = stateRef.current
    if (go) { setAiThinking(false); return }
    const move = pickAIMove(b, BLACK, ep)
    if (!move) { setAiThinking(false); return } // handled by gameStatus already
    const res = applyMove(b, move)
    if (res.captured) playCapture(); else playMove()
    setBoard(res.board)
    if (res.castle) addLog('🤖 Computer castled! 🏰')
    else if (res.promoted) addLog('🤖 Computer promoted to Queen! 👑')
    else if (res.captured) addLog('🤖 Computer captured a piece! 💥')
    else addLog('🤖 Computer moved.')
    setAiThinking(false)
    finishTurn(res.board, BLACK, move)
  }

  useEffect(() => {
    if (mode !== 'cpu') return
    if (turn !== BLACK || gameOver) return
    setAiThinking(true)
    aiTimer.current = setTimeout(runAI, AI_DELAY)
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current) }
  }, [turn, gameOver, mode]) // eslint-disable-line

  useEffect(() => () => { if (aiTimer.current) clearTimeout(aiTimer.current) }, [])

  // king-in-check square (for highlight)
  const checkedSide = !gameOver && inCheck(board, turn) ? turn : null
  const checkedKing = checkedSide ? findKing(board, checkedSide) : null

  const status = gameOver
    ? ''
    : aiThinking ? '🤖 Computer is thinking...'
    : mode === 'cpu'
      ? (turn === WHITE ? 'Your turn — tap a piece, then a glowing square.' : '')
      : `${turn === WHITE ? '♙ Player 1 (White)' : '♟ Player 2 (Black)'} — tap a piece, then a glowing square.`

  // ── Setup screen ──
  if (phase === 'setup') {
    return (
      <div className="chess-screen screen">
        <div className="cs-main">
          <motion.div
            className="cs-setup"
            initial={{ opacity: 0, y: 24, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 280, damping: 24 } }}
          >
            <div className="cs-setup-title">{theme.emoji} Chess</div>
            <div className="cs-setup-label">Choose mode</div>
            <div className="cs-mode-btns">
              <button
                className={`cs-mode-btn${mode === 'cpu' ? ' selected' : ''}`}
                onClick={() => setMode('cpu')}
              >
                <span className="cs-mode-icon">🤖</span>
                <span className="cs-mode-name">1 vs PC</span>
                <span className="cs-mode-desc">Play against the computer</span>
              </button>
              <button
                className={`cs-mode-btn${mode === 'friends' ? ' selected' : ''}`}
                onClick={() => setMode('friends')}
              >
                <span className="cs-mode-icon">🆚</span>
                <span className="cs-mode-name">1 vs 1</span>
                <span className="cs-mode-desc">Two players, same screen</span>
              </button>
            </div>
            <button className="btn btn-primary cs-start-btn" onClick={startGame}>
              Start Game
            </button>
            <button className="btn btn-secondary cs-back-setup-btn" onClick={onBack}>← Back</button>
          </motion.div>
        </div>
      </div>
    )
  }

  // ── Playing screen ──
  return (
    <div className="chess-screen screen">

      {/* ── Side panel ── */}
      <div className="cs-side">
        <button className="btn btn-secondary back-btn" onClick={restart}>← Menu</button>
        <div className="cs-side-title">{theme.emoji} Chess</div>
        <div className="cs-players">
          <span className={`cs-player p1${turn === WHITE && !gameOver ? ' active' : ''}`}>♙ {p1Label}</span>
          <span className={`cs-player p2${turn === BLACK && !gameOver ? ' active' : ''}`}>♟ {p2Label}</span>
        </div>
        {!gameOver && (
          <div className={`turn-banner cs-turn${checkedSide ? ' check-alert' : ''}`}>
            {checkedSide ? 'Check!' : status}
          </div>
        )}
        {gameOver && (
          <div className="cs-gameover-btns">
            <button className="btn btn-primary" onClick={startGame}>Play Again</button>
            <button className="btn btn-secondary" onClick={restart}>Menu</button>
          </div>
        )}
        <div className="log-box">
          {log.map((l, i) => <div key={i} className={`log-line ${i === 0 ? 'new' : ''}`}>{l}</div>)}
        </div>
      </div>

      {/* ── Board area ── */}
      <div className="cs-main">
        <AnimatePresence mode="wait">
          {gameOver ? (
            <motion.div
              key="gameover"
              className="gameover"
              variants={gameoverVariants}
              initial="initial"
              animate="animate"
            >
              <div className="gameover-emoji">{winner === 'draw' ? '🤝' : (winner === WHITE ? '🏆' : (mode === 'cpu' ? '🤖' : '🏆'))}</div>
              <h2>
                {winner === 'draw'
                  ? 'Draw!'
                  : winner === WHITE ? `${p1Label} wins!` : `${p2Label} wins!`}
              </h2>
              <p>
                {endKind === 'stalemate'
                  ? 'Stalemate — nobody can move. 🤝'
                  : endKind === 'insufficient'
                  ? 'Not enough pieces left to checkmate. 🤝'
                  : winner === WHITE
                    ? (mode === 'cpu' ? 'Checkmate! Great game! 🎉' : '♙ Player 1 checkmates! 🎉')
                    : (mode === 'cpu' ? 'Checkmate — nice try, play again!' : '♟ Player 2 checkmates! 🎉')}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="playing"
              className="chess-play"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.3 } }}
            >
              <div className="chess-board">
                {board.map((row, r) =>
                  row.map((cell, c) => {
                    const dark = (r + c) % 2 === 1
                    const isSel = selected && selected[0] === r && selected[1] === c
                    const dest = isDest(r, c)
                    const isChecked = checkedKing && checkedKing[0] === r && checkedKing[1] === c
                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`cs-square ${dark ? 'dark' : 'light'}${dest ? ' dest' : ''}${isSel ? ' selected' : ''}${isChecked ? ' in-check' : ''}`}
                        onClick={() => handleSquare(r, c)}
                      >
                        {dest && <span className={`cs-dot${cell ? ' capture' : ''}`} />}
                        <AnimatePresence>
                          {cell && (
                            <motion.div
                              key={`${cell.side}-${cell.type}-${r}-${c}`}
                              className={`cs-piece ${cell.side === WHITE ? 'white' : 'black'}`}
                              title={NAME[cell.type]}
                              initial={{ scale: 0.4, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.3, opacity: 0, transition: { duration: 0.18 } }}
                              transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                            >
                              <img
                                className="cs-piece-img"
                                src={PIECE_IMG[cell.side][cell.type]}
                                alt={NAME[cell.type]}
                                draggable={false}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
