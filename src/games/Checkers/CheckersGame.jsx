import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { themePieces } from '../../data/pieces'
import './Checkers.css'
import { playMove, playCapture, playWin } from '../../sound/sfx'
import { useT } from '../../i18n'

// ─── constants ───────────────────────────────────────────────────────────────
const SIZE = 8
const HUMAN = 'human'   // bottom, moves up (row decreases)
const COMP  = 'comp'    // top, moves down (row increases)

// ─── board helpers ─────────────────────────────────────────────────────────────
function makeInitialBoard() {
  const b = Array.from({ length: SIZE }, () => Array(SIZE).fill(null))
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const dark = (r + c) % 2 === 1
      if (!dark) continue
      if (r < 3)             b[r][c] = { side: COMP,  king: false }
      else if (r > SIZE - 4) b[r][c] = { side: HUMAN, king: false }
    }
  }
  return b
}

const inBounds = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE
const clone = (b) => b.map(row => row.map(cell => (cell ? { ...cell } : null)))

function dirsFor(piece) {
  if (piece.king) return [[-1, -1], [-1, 1], [1, -1], [1, 1]]
  return piece.side === HUMAN ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]
}

function movesForPiece(board, r, c) {
  const piece = board[r][c]
  if (!piece) return []
  const out = []
  for (const [dr, dc] of dirsFor(piece)) {
    const sr = r + dr, sc = c + dc
    if (inBounds(sr, sc) && !board[sr][sc]) {
      out.push({ from: [r, c], to: [sr, sc], capture: null })
    }
    const jr = r + dr * 2, jc = c + dc * 2
    if (inBounds(jr, jc) && !board[jr][jc] && board[sr] && board[sr][sc] && board[sr][sc].side !== piece.side) {
      out.push({ from: [r, c], to: [jr, jc], capture: [sr, sc] })
    }
  }
  return out
}

function allMoves(board, side) {
  const moves = []
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (board[r][c] && board[r][c].side === side)
        moves.push(...movesForPiece(board, r, c))
  return moves
}

function countPieces(board, side) {
  let n = 0
  for (const row of board) for (const cell of row) if (cell && cell.side === side) n++
  return n
}

function applyMove(board, move) {
  const b = clone(board)
  const [fr, fc] = move.from
  const [tr, tc] = move.to
  const piece = { ...b[fr][fc] }
  b[fr][fc] = null
  if (move.capture) {
    const [cr, cc] = move.capture
    b[cr][cc] = null
  }
  let promoted = false
  if (!piece.king) {
    if (piece.side === HUMAN && tr === 0)        { piece.king = true; promoted = true }
    if (piece.side === COMP  && tr === SIZE - 1) { piece.king = true; promoted = true }
  }
  b[tr][tc] = piece
  let again = false
  if (move.capture && !promoted) {
    const more = movesForPiece(b, tr, tc).filter(m => m.capture)
    if (more.length) again = true
  }
  return { board: b, captured: !!move.capture, promoted, again, againFrom: again ? [tr, tc] : null }
}

const AI_DELAY = 750

const gameoverVariants = {
  initial: { opacity: 0, scale: 0.85, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
}

export default function CheckersGame({ onBack }) {
  const t = useT()
  const { theme } = useTheme()
  const pieces = themePieces(theme)
  const E1 = pieces.human.emoji, E2 = pieces.comp.emoji

  const [phase,    setPhase]    = useState('setup')   // 'setup' | 'playing'
  const [mode,     setMode]     = useState('cpu')      // 'cpu' | 'friends'

  const [board,    setBoard]    = useState(makeInitialBoard)
  const [turn,     setTurn]     = useState(HUMAN)
  const [selected, setSelected] = useState(null)
  const [chainCell, setChainCell] = useState(null)
  const [gameOver, setGameOver] = useState(false)
  const [winner,   setWinner]   = useState(null)
  const [aiThinking, setAiThinking] = useState(false)
  const [log,      setLog]      = useState([])

  const aiTimer = useRef(null)
  const stateRef = useRef({})
  stateRef.current = { board, turn, gameOver }

  const addLog = (msg) => setLog(prev => [msg, ...prev].slice(0, 4))

  const startGame = () => {
    if (aiTimer.current) { clearTimeout(aiTimer.current); aiTimer.current = null }
    setBoard(makeInitialBoard())
    setTurn(HUMAN); setSelected(null); setChainCell(null)
    setGameOver(false); setWinner(null); setAiThinking(false)
    setLog(mode === 'cpu'
      ? [t('Your move! Tap a piece.')]
      : [`${E1} ` + t("Player 1's move! Tap a piece.")])
    setPhase('playing')
  }

  const restart = () => setPhase('setup')

  const checkEnd = (b, sideToMove) => {
    if (countPieces(b, HUMAN) === 0) { playWin(); setGameOver(true); setWinner(COMP);  return true }
    if (countPieces(b, COMP)  === 0) { playWin(); setGameOver(true); setWinner(HUMAN); return true }
    if (allMoves(b, sideToMove).length === 0) {
      playWin(); setGameOver(true); setWinner(sideToMove === HUMAN ? COMP : HUMAN); return true
    }
    return false
  }

  // current side that a human controls right now
  const humanSide = mode === 'friends' ? turn : HUMAN

  const legalForSelected = selected
    ? movesForPiece(board, selected[0], selected[1])
    : []
  const activeMoves = chainCell
    ? movesForPiece(board, chainCell[0], chainCell[1]).filter(m => m.capture)
    : legalForSelected
  const isDest = (r, c) => activeMoves.some(m => m.to[0] === r && m.to[1] === c)

  // ── human interaction ─────────────────────────────────────────────────────
  const handleSquare = (r, c) => {
    const isHumanTurn = mode === 'cpu' ? turn === HUMAN : true
    if (!isHumanTurn || gameOver || aiThinking) return
    const cell = board[r][c]

    if (chainCell) {
      const move = movesForPiece(board, chainCell[0], chainCell[1])
        .filter(m => m.capture)
        .find(m => m.to[0] === r && m.to[1] === c)
      if (move) return doMove(move)
      return
    }

    if (cell && cell.side === humanSide) {
      setSelected([r, c])
      return
    }
    if (selected) {
      const move = movesForPiece(board, selected[0], selected[1])
        .find(m => m.to[0] === r && m.to[1] === c)
      if (move) return doMove(move)
    }
  }

  const p1Label = mode === 'cpu' ? t('You') : t('Player 1')
  const p2Label = mode === 'cpu' ? t('Computer') : t('Player 2')

  const doMove = (move) => {
    const mover = turn
    const res = applyMove(board, move)
    if (res.captured) playCapture(); else playMove()
    setBoard(res.board)
    const youMoved = mover === HUMAN && mode === 'cpu'
    const moverLabel = mover === HUMAN ? `${E1} ${p1Label}` : `${E2} ${p2Label}`
    const say = (en, enYou) => youMoved ? `${E1} ` + t(enYou) : t(en, { name: moverLabel })
    if (res.captured) addLog(res.promoted ? say('{name} captured & crowned a King!', 'You captured & crowned a King!') + ' 👑' : say('{name} captured a piece!', 'You captured a piece!') + ' 💥')
    else if (res.promoted) addLog(say('{name} got a King!', 'You got a King!') + ' 👑')

    if (res.again) {
      setSelected(res.againFrom)
      setChainCell(res.againFrom)
      addLog(t('Jump again! Keep capturing.') + ' 🔥')
      return
    }
    setSelected(null)
    setChainCell(null)
    const nextSide = mover === HUMAN ? COMP : HUMAN
    if (checkEnd(res.board, nextSide)) return
    setTurn(nextSide)
  }

  // ── AI turn (cpu mode only) ───────────────────────────────────────────────
  const runAI = () => {
    const { board: b, gameOver: go } = stateRef.current
    if (go) { setAiThinking(false); return }

    let working = clone(b)
    const moves = allMoves(working, COMP)
    if (moves.length === 0) {
      setAiThinking(false)
      setGameOver(true); setWinner(HUMAN)
      return
    }
    const captures = moves.filter(m => m.capture)
    let move = captures.length
      ? captures[Math.floor(Math.random() * captures.length)]
      : moves[Math.floor(Math.random() * moves.length)]

    let didCapture = false
    let promoted = false
    while (true) {
      const res = applyMove(working, move)
      working = res.board
      didCapture = didCapture || res.captured
      promoted = promoted || res.promoted
      if (res.again) {
        const next = movesForPiece(working, res.againFrom[0], res.againFrom[1]).filter(m => m.capture)
        move = next[Math.floor(Math.random() * next.length)]
        continue
      }
      break
    }

    if (didCapture) playCapture(); else playMove()
    setBoard(working)
    if (didCapture) addLog('🤖 ' + (promoted ? t('{name} captured & crowned a King!', { name: t('Computer') }) : t('{name} captured a piece!', { name: t('Computer') })))
    else if (promoted) addLog('🤖 ' + t('{name} got a King!', { name: t('Computer') }) + ' 👑')
    else addLog('🤖 ' + t('Computer moved.'))

    setAiThinking(false)
    if (checkEnd(working, HUMAN)) return
    setTurn(HUMAN)
  }

  useEffect(() => {
    if (mode !== 'cpu') return
    if (turn !== COMP || gameOver) return
    setAiThinking(true)
    aiTimer.current = setTimeout(runAI, AI_DELAY)
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current) }
  }, [turn, gameOver, mode]) // eslint-disable-line

  useEffect(() => () => { if (aiTimer.current) clearTimeout(aiTimer.current) }, [])

  const humanCount = countPieces(board, HUMAN)
  const compCount  = countPieces(board, COMP)

  const turnLabel = turn === HUMAN
    ? (mode === 'cpu' ? `${E1} ` + t('Your turn') : `${E1} ` + t("{name}'s turn", { name: p1Label }))
    : mode === 'cpu' ? '🤖 ' + t('Computer is thinking…') : `${E2} ` + t("{name}'s turn", { name: p2Label })

  const status = gameOver
    ? ''
    : aiThinking ? '🤖 ' + t('Computer is thinking…')
    : chainCell ? t('Jump again! Keep capturing.')
    : mode === 'cpu'
      ? (turn === HUMAN ? t('Your turn — tap a piece, then a glowing square.') : '')
      : `${turn === HUMAN ? `${E1} ` + t('Player 1') : `${E2} ` + t('Player 2')} — ` + t('tap a piece, then a glowing square.')

  // ── Setup screen ──────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="checkers-screen screen">
        <div className="ck-main">
          <motion.div
            className="ck-setup"
            initial={{ opacity: 0, y: 24, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 280, damping: 24 } }}
          >
            <div className="ck-setup-title">{theme.emoji} {t('Checkers')}</div>
            <div className="ck-setup-label">{t('Choose mode')}</div>
            <div className="ck-mode-btns">
              <button
                className={`ck-mode-btn${mode === 'cpu' ? ' selected' : ''}`}
                onClick={() => setMode('cpu')}
              >
                <span className="ck-mode-icon">🤖</span>
                <span className="ck-mode-name">{t('1 vs PC')}</span>
                <span className="ck-mode-desc">{t('Play against the computer')}</span>
              </button>
              <button
                className={`ck-mode-btn${mode === 'friends' ? ' selected' : ''}`}
                onClick={() => setMode('friends')}
              >
                <span className="ck-mode-icon">🆚</span>
                <span className="ck-mode-name">{t('1 vs 1')}</span>
                <span className="ck-mode-desc">{t('Two players, same screen')}</span>
              </button>
            </div>
            <button className="btn btn-primary ck-start-btn" onClick={startGame}>
              {t('Start Game')}
            </button>
            <button className="btn btn-secondary ck-back-setup-btn" onClick={onBack}>← {t('Back')}</button>
          </motion.div>
        </div>
      </div>
    )
  }

  // ── Playing screen ────────────────────────────────────────────────────────
  return (
    <div className="checkers-screen screen">

      {/* ── Side panel ── */}
      <div className="ck-side">
        <button className="btn btn-secondary back-btn" onClick={restart}>← {t('Menu')}</button>
        <div className="ck-side-title">{theme.emoji} {t('Checkers')}</div>
        <div className="scores">
          <span className="score p1"><img className="ck-score-face" src={pieces.human.image} alt="" /> {humanCount}</span>
          <span className="score p2"><img className="ck-score-face" src={pieces.comp.image} alt="" /> {compCount}</span>
        </div>
        {!gameOver && (
          <div className={`turn-banner ck-turn${chainCell ? ' chain-alert' : ''}`}>{status}</div>
        )}
        {gameOver && (
          <div className="ck-gameover-btns">
            <button className="btn btn-primary" onClick={startGame}>{t('Play Again')}</button>
            <button className="btn btn-secondary" onClick={restart}>{t('Menu')}</button>
          </div>
        )}
        <div className="log-box">
          {log.map((l, i) => <div key={i} className={`log-line ${i === 0 ? 'new' : ''}`}>{l}</div>)}
        </div>
      </div>

      {/* ── Board area ── */}
      <div className="ck-main">
        <AnimatePresence mode="wait">
          {gameOver ? (
            <motion.div
              key="gameover"
              className="gameover"
              variants={gameoverVariants}
              initial="initial"
              animate="animate"
            >
              <div className="gameover-emoji">{winner === HUMAN ? '🏆' : (mode === 'cpu' ? '🤖' : '🏆')}</div>
              <h2>{winner === HUMAN && mode === 'cpu' ? t('You win!') : t('{name} wins!', { name: winner === HUMAN ? p1Label : p2Label })}</h2>
              <p>{winner === HUMAN
                ? (mode === 'cpu' ? t('Great moves!') + ' 🎉' : `${E1} ` + t('{name} takes it!', { name: t('Player 1') }) + ' 🎉')
                : (mode === 'cpu' ? t('Nice try — play again!') : `${E2} ` + t('{name} takes it!', { name: t('Player 2') }) + ' 🎉')}</p>
            </motion.div>
          ) : (
            <motion.div
              key="playing"
              className="checkers-play"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.3 } }}
            >
              <div className="checkers-board">
                {board.map((row, r) =>
                  row.map((cell, c) => {
                    const dark = (r + c) % 2 === 1
                    const isSel = selected && selected[0] === r && selected[1] === c
                    const isChain = chainCell && chainCell[0] === r && chainCell[1] === c
                    const dest = dark && isDest(r, c)
                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`ck-square ${dark ? 'dark' : 'light'}${dest ? ' dest' : ''}${isSel ? ' selected' : ''}${isChain ? ' chain' : ''}`}
                        onClick={() => handleSquare(r, c)}
                      >
                        {dest && <span className="ck-dot" />}
                        <AnimatePresence>
                          {cell && (
                            <motion.div
                              key={`${cell.side}-${r}-${c}`}
                              className={`ck-piece ${cell.side === HUMAN ? 'human' : 'comp'}${cell.king ? ' king' : ''}${isChain ? ' chain' : ''}`}
                              initial={{ scale: 0.4, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.3, opacity: 0, transition: { duration: 0.18 } }}
                              transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                              style={cell.side === HUMAN ? { '--piece-color': pieces.color } : undefined}
                            >
                              <img className="ck-face" draggable="false" alt=""
                                src={cell.side === HUMAN ? pieces.human.image : pieces.comp.image} />
                              {cell.king && <span className="ck-crown">👑</span>}
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
