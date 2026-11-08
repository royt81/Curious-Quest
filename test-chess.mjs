import {
  makeInitialBoard, legalMoves, legalMovesForPiece, applyMove,
  gameStatus, inCheck, pickAIMove, enPassantTargetAfter, WHITE, BLACK, clone
} from './src/games/Chess/chessEngine.js'

let fails = 0
const ok = (cond, msg) => { if (!cond) { console.log('FAIL:', msg); fails++ } else console.log('ok:', msg) }

// 1. Initial legal moves = 20 per side
const b = makeInitialBoard()
ok(legalMoves(b, WHITE).length === 20, 'white has 20 opening moves')
ok(legalMoves(b, BLACK).length === 20, 'black has 20 opening moves')

// 2. Knight from b1 has 2 moves
ok(legalMovesForPiece(b, 7, 1, WHITE).length === 2, 'knight b1 -> 2 moves')

// 3. Pawn double move + en passant target
const e4 = legalMovesForPiece(b,6,4,WHITE).find(m=>m.to[0]===4&&m.to[1]===4)
ok(!!e4 && e4.double, 'e2-e4 double move exists')
ok(JSON.stringify(enPassantTargetAfter(e4))===JSON.stringify([5,4]), 'en passant target [5,4]')

// 4. Fool's mate -> checkmate detection
// 1. f3 e5 2. g4 Qh4#
let g = makeInitialBoard()
const mv = (fr,fc,tr,tc,ep=null)=>{
  const list = legalMovesForPiece(g, fr,fc, g[fr][fc].side, ep)
  const m = list.find(x=>x.to[0]===tr&&x.to[1]===tc)
  if(!m){ throw new Error(`no move ${fr},${fc}->${tr},${tc}`) }
  g = applyMove(g,m).board
  return m
}
mv(6,5,5,5)          // f2-f3 (white)
const epB = enPassantTargetAfter(mv(1,4,3,4)) // e7-e5 (black)
mv(6,6,4,6)          // g2-g4 (white)
mv(0,3,4,7)          // Qd8-h4 (black) check
ok(inCheck(g, WHITE), "fool's mate: white in check")
ok(gameStatus(g, WHITE)==='checkmate', "fool's mate: checkmate detected")

// 5. Castling king-side: clear f1,g1 and ensure move exists
let c = makeInitialBoard()
c[7][5]=null; c[7][6]=null // remove bishop f1, knight g1
const kingMoves = legalMovesForPiece(c,7,4,WHITE)
ok(kingMoves.some(m=>m.castle==='k'), 'king-side castle available when path clear')
const after = applyMove(c, kingMoves.find(m=>m.castle==='k')).board
ok(after[7][6] && after[7][6].type==='k' && after[7][5] && after[7][5].type==='r', 'castle moves king+rook')

// 6. Cannot castle through check
let c2 = makeInitialBoard()
c2[7][5]=null; c2[7][6]=null
c2[1][5]=null // open black pawn f-file? Put a black rook attacking f1
c2[0][5]=null
c2[6][5]=null // remove white f-pawn so f-file open
c2[5][5]={side:BLACK,type:'r',moved:true} // black rook on f3 attacks f1
const km2 = legalMovesForPiece(c2,7,4,WHITE)
ok(!km2.some(m=>m.castle==='k'), 'cannot castle through attacked square')

// 7. Stalemate detection (classic): black king a8, white king c7? build known stalemate
// White: Kb6, Qc7? that's mate. Use: black Kh8, white Kf7, Qg6 -> stalemate
let s = Array.from({length:8},()=>Array(8).fill(null))
s[0][7]={side:BLACK,type:'k',moved:true}   // h8
s[1][5]={side:WHITE,type:'k',moved:true}   // f7
s[2][6]={side:WHITE,type:'q',moved:true}   // g6
ok(!inCheck(s,BLACK), 'stalemate setup: black not in check')
ok(gameStatus(s,BLACK)==='stalemate', 'stalemate detected')

// 8. Pawn promotion auto-queen
let p = Array.from({length:8},()=>Array(8).fill(null))
p[1][0]={side:WHITE,type:'p',moved:true}
p[0][7]={side:BLACK,type:'k',moved:true}
p[7][4]={side:WHITE,type:'k',moved:true}
const promo = legalMovesForPiece(p,1,0,WHITE).find(m=>m.to[0]===0)
ok(promo && promo.promote, 'promotion move flagged')
ok(applyMove(p,promo).board[0][0].type==='q', 'promoted to queen')

// 9. AI returns a legal move from opening
const aim = pickAIMove(makeInitialBoard(), BLACK)
ok(aim && legalMoves(makeInitialBoard(),BLACK).some(m=>JSON.stringify(m.from)===JSON.stringify(aim.from)&&JSON.stringify(m.to)===JSON.stringify(aim.to)), 'AI returns a legal move')

// 10. King cannot move into check (pinned situation): white king e1, black rook e8, no blockers -> Ke1 can't stay on e-file moves; e2 illegal
let k = Array.from({length:8},()=>Array(8).fill(null))
k[7][4]={side:WHITE,type:'k',moved:false}
k[0][4]={side:BLACK,type:'r',moved:true}
const kmv = legalMovesForPiece(k,7,4,WHITE)
ok(!kmv.some(m=>m.to[1]===4), 'king cannot stay on attacked e-file (e2 illegal)')
ok(kmv.some(m=>m.to[1]===3||m.to[1]===5), 'king can step off the file')

console.log(fails===0 ? '\nALL PASS' : `\n${fails} FAILED`)
process.exit(fails===0?0:1)
