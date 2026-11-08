import { useMemo, useState, useEffect } from 'react'
import { useLottie } from 'lottie-react'
import { useTheme } from '../context/ThemeContext'
import './BackgroundAnimation.css'

// Flapping-bird Lottie used in the Animals background. Lives in /public so it's
// fetched at runtime (keeps it out of the JS bundle).
const BIRD_LOTTIE_URL = '/themes/Animals/bg-images/Bird.json'

// Reef fish images used for the underwater background
const FISH_IMAGES = [
  '/themes/Underwater/bg-images/fish.svg',
  '/themes/Underwater/bg-images/fish (1).svg',
  '/themes/Underwater/bg-images/fish (2).svg',
  '/themes/Underwater/bg-images/fish (3).svg',
  '/themes/Underwater/bg-images/fish (4).svg',
  '/themes/Underwater/bg-images/puffer-fish.svg',
  '/themes/Underwater/bg-images/clown-fish.svg',
  '/themes/Underwater/bg-images/tropical-fish.svg',
  '/themes/Underwater/bg-images/angler.svg',
]

// Most fish art faces right by default; mark any that face left instead
// so we can flip them the opposite way to keep swim direction correct.
const FISH_FACES_LEFT = FISH_IMAGES.map(src => src.includes('angler') || src.includes('clown-fish') || src.includes('tropical-fish'))

// Seeded random so particles are stable across re-renders
function seededRand(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

// ─── SVG helpers ──────────────────────────────────────────────────────────────

/** Soaring white gull viewed from below — faces right. Wings flap independently
 *  via the shared .bird-wing classes. */
function SvgBird({ width = 36, flapDur = 0.9, flapDelay = 0 }) {
  const w = width, h = Math.round(width * 0.58)
  return (
    <svg width={w} height={h} viewBox="0 0 50 30"
         xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', overflow: 'visible' }}>
      {/* Tail */}
      <path d="M22,16 Q17,23 13,22 Q18,18 23,17 Z"
            fill="rgba(255,255,255,0.70)" />
      {/* Body */}
      <ellipse cx="25" cy="15" rx="4.2" ry="2.1" fill="rgba(255,255,255,0.92)" />
      {/* Head */}
      <ellipse cx="29.8" cy="13" rx="3.2" ry="2.3" fill="rgba(255,255,255,0.92)" />
      {/* Beak */}
      <path d="M32.4,12.6 L36.6,12.1 L32.4,14 Z" fill="rgba(255,200,90,0.95)" />
      {/* Left wing — hinged at the body, flaps about its root */}
      <g className="bird-wing bird-wing-l"
         style={{ transformOrigin: '25px 14px',
                  animationDuration: `${flapDur}s`, animationDelay: `${flapDelay}s` }}>
        <path d="M25,14 C19,9 11,6 1,11 C10,13 18,14 24,15 Z"
              fill="rgba(255,255,255,0.85)" />
      </g>
      {/* Right wing */}
      <g className="bird-wing bird-wing-r"
         style={{ transformOrigin: '25px 14px',
                  animationDuration: `${flapDur}s`, animationDelay: `${flapDelay}s` }}>
        <path d="M25,14 C31,9 39,6 49,11 C40,13 32,14 26,15 Z"
              fill="rgba(255,255,255,0.85)" />
      </g>
    </svg>
  )
}

/** One Lottie flapping bird. The animation art faces left and sits left-of-centre
 *  in a 16:9 frame; `width` sizes the (mostly transparent) frame. Each bird gets
 *  its own speed and start frame so the flock isn't beating in lock-step. */
function LottieBird({ data, width, speed = 1, startFrame = 0, faceRight = false }) {
  const { View, animationItem, animationLoaded } = useLottie(
    { animationData: data, loop: true, autoplay: true },
    { width: `${width}px`, height: `${Math.round(width * 0.5625)}px` },
  )
  useEffect(() => {
    if (!animationLoaded || !animationItem) return
    animationItem.setSpeed(speed)
    animationItem.goToAndPlay(startFrame, true)
  }, [animationLoaded, animationItem, speed, startFrame])
  // Art faces left by default; mirror it when the bird travels right.
  return <div style={{ transform: faceRight ? 'scaleX(-1)' : 'none' }}>{View}</div>
}

/** Reef fish in three distinct silhouettes, hue-parameterised, with soft
 *  shading and an independently-swishing tail.  `species`:
 *   0 = round angelfish, 1 = sleek torpedo fish, 2 = chubby pufferfish.
 *  Art faces RIGHT. */
function SvgFish({ uid = 0, width = 44, hue = 25, species = 0, swishDur = 0.7, swishDelay = 0 }) {
  const gid = `fish-bg-${uid}`
  const sid = `fish-sheen-${uid}`
  const h   = Math.round(width * 0.7)
  const lo  = `hsl(${hue},70%,34%)`
  const mid = `hsl(${hue},82%,52%)`
  const hi  = `hsl(${hue},92%,72%)`

  // Per-species body + fin geometry (all in the 56×36 viewBox, facing right)
  const shapes = [
    { // 0 — rounded angelfish, tall body, big flowing fins
      body:    'M14,18 Q16,5 30,5 Q46,5 50,18 Q46,31 30,31 Q16,31 14,18 Z',
      dorsal:  'M22,7 Q28,-2 40,6 Q33,8 24,9 Z',
      belly:   'M22,29 Q28,38 40,30 Q33,28 24,27 Z',
      stripes: ['M24,11 Q26,18 24,26', 'M31,9 Q34,18 31,28', 'M38,10 Q41,18 38,27'],
      eye:     [44, 16],
    },
    { // 1 — sleek torpedo / tuna-like, long and tapered
      body:    'M14,18 Q20,9 34,9 Q50,9 53,18 Q50,27 34,27 Q20,27 14,18 Z',
      dorsal:  'M24,9.5 Q30,3 39,9 Q33,9.5 26,10 Z',
      belly:   'M26,26 Q31,32 38,26 Q33,26.5 28,26 Z',
      stripes: ['M18,18 Q34,15 50,17', 'M20,21 Q34,19 48,21'],
      eye:     [46, 16],
    },
    { // 2 — chubby pufferfish, almost circular
      body:    'M16,18 Q16,7 30,7 Q45,7 47,18 Q45,29 30,29 Q16,29 16,18 Z',
      dorsal:  'M24,8 Q29,2 36,7 Q31,8 25,9 Z',
      belly:   'M24,28 Q29,34 36,29 Q31,28 25,28 Z',
      stripes: [],
      spots:   [[26,13],[33,12],[38,16],[30,21],[37,22],[24,19]],
      eye:     [42, 15],
    },
  ]
  const sp  = shapes[species % shapes.length]
  const eye = sp.eye
  return (
    <svg width={width} height={h} viewBox="0 0 56 36"
         xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id={gid} cx="60%" cy="32%" r="72%">
          <stop offset="0%"   stopColor={hi} />
          <stop offset="55%"  stopColor={mid} />
          <stop offset="100%" stopColor={lo} />
        </radialGradient>
        <linearGradient id={sid} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.32)" />
          <stop offset="45%"  stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
        </linearGradient>
      </defs>
      {/* Tail fin — hinged at the body's rear, swishes side to side */}
      <g className="fish-tail"
         style={{ transformOrigin: '15px 18px',
                  animationDuration: `${swishDur}s`, animationDelay: `${swishDelay}s` }}>
        <path d="M15,18 Q2,7 1,9 Q6,18 1,27 Q2,29 15,18 Z" fill={lo} opacity="0.92" />
        <path d="M15,18 Q6,12 4,13 Q7,18 4,23 Q6,24 15,18 Z" fill={mid} opacity="0.6" />
      </g>
      {/* Dorsal fin */}
      <path d={sp.dorsal} fill={mid} opacity="0.82" />
      {/* Belly / pelvic fin */}
      {sp.belly && <path d={sp.belly} fill={lo} opacity="0.7" />}
      {/* Body */}
      <path d={sp.body} fill={`url(#${gid})`} />
      {/* Soft sheen overlay */}
      <path d={sp.body} fill={`url(#${sid})`} />
      {/* Pectoral fin — gentle flutter */}
      <g className="fish-pectoral"
         style={{ transformOrigin: '30px 22px',
                  animationDuration: `${(swishDur * 1.15).toFixed(2)}s`, animationDelay: `${swishDelay}s` }}>
        <path d="M30,20 Q35,30 27,27 Q29,23 30,20 Z" fill={lo} opacity="0.7" />
      </g>
      {/* Markings */}
      {sp.stripes && sp.stripes.map((d, i) => (
        <path key={i} d={d} stroke="rgba(255,255,255,0.22)" strokeWidth="1.4" fill="none" />
      ))}
      {sp.spots && sp.spots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.5" fill="rgba(255,255,255,0.22)" />
      ))}
      {/* Eye */}
      <circle cx={eye[0]} cy={eye[1]} r="3"   fill="rgba(255,255,255,0.95)" />
      <circle cx={eye[0] + 0.4} cy={eye[1]} r="1.7" fill="rgba(15,18,40,0.9)" />
      <circle cx={eye[0] + 1.1} cy={eye[1] - 0.9} r="0.75" fill="rgba(255,255,255,0.98)" />
    </svg>
  )
}

/** Drifting jellyfish — translucent bell + wavy tentacles. */
function SvgJelly({ uid = 0, width = 40, hue = 290 }) {
  const gid = `jelly-${uid}`
  const h = Math.round(width * 1.4)
  return (
    <svg width={width} height={h} viewBox="0 0 40 56"
         xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id={gid} cx="50%" cy="35%" r="65%">
          <stop offset="0%"   stopColor={`hsla(${hue},90%,80%,0.85)`} />
          <stop offset="70%"  stopColor={`hsla(${hue},80%,62%,0.55)`} />
          <stop offset="100%" stopColor={`hsla(${hue},70%,48%,0.30)`} />
        </radialGradient>
      </defs>
      <g className="jelly-tent" style={{ transformOrigin: '20px 22px' }}>
        {[10, 15, 20, 25, 30].map((x, i) => (
          <path key={i} d={`M${x},22 Q${x + (i % 2 ? 4 : -4)},38 ${x},54`}
                stroke={`hsla(${hue},85%,72%,0.55)`} strokeWidth="2" fill="none"
                strokeLinecap="round" />
        ))}
      </g>
      {/* Bell */}
      <path d="M4,22 Q4,4 20,4 Q36,4 36,22 Q28,26 20,26 Q12,26 4,22 Z"
            fill={`url(#${gid})`} />
      <path d="M9,12 Q20,8 31,12" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4" fill="none" />
    </svg>
  )
}

/** Classic satellite with solar panels, flying sideways */
function SvgSatellite({ uid = 0, width = 70 }) {
  const gid = `sat-body-${uid}`
  const h = Math.round(width * 0.45)
  return (
    <svg width={width} height={h} viewBox="0 0 100 45"
         xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#c8d8f0" />
          <stop offset="50%"  stopColor="#8aaace" />
          <stop offset="100%" stopColor="#4a6a9c" />
        </linearGradient>
      </defs>
      {/* Left solar panel */}
      <rect x="2" y="16" width="28" height="13" rx="2" fill="#1a3a7a" stroke="rgba(100,160,255,0.5)" strokeWidth="1" />
      <line x1="16" y1="16" x2="16" y2="29" stroke="rgba(100,160,255,0.4)" strokeWidth="1" />
      <line x1="2"  y1="22" x2="30" y2="22" stroke="rgba(100,160,255,0.3)" strokeWidth="1" />
      {/* Panel shine */}
      <rect x="2" y="16" width="28" height="5" rx="2" fill="rgba(120,180,255,0.15)" />
      {/* Connecting arm left */}
      <rect x="30" y="20" width="12" height="5" rx="1" fill="#6a7a9a" />
      {/* Main body */}
      <rect x="42" y="12" width="24" height="21" rx="4" fill={`url(#${gid})`} stroke="rgba(150,180,220,0.5)" strokeWidth="1.2" />
      <rect x="44" y="14" width="8" height="5" rx="1" fill="rgba(255,200,60,0.7)" />
      <circle cx="60" cy="22" r="4" fill="rgba(180,210,255,0.6)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      {/* Connecting arm right */}
      <rect x="66" y="20" width="12" height="5" rx="1" fill="#6a7a9a" />
      {/* Right solar panel */}
      <rect x="78" y="16" width="20" height="13" rx="2" fill="#1a3a7a" stroke="rgba(100,160,255,0.5)" strokeWidth="1" />
      <line x1="88" y1="16" x2="88" y2="29" stroke="rgba(100,160,255,0.4)" strokeWidth="1" />
      <line x1="78" y1="22" x2="98" y2="22" stroke="rgba(100,160,255,0.3)" strokeWidth="1" />
      <rect x="78" y="16" width="20" height="5" rx="2" fill="rgba(120,180,255,0.15)" />
      {/* Antenna */}
      <line x1="54" y1="12" x2="54" y2="4" stroke="#8899bb" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="54" cy="3.5" r="2" fill="rgba(100,200,255,0.9)" />
    </svg>
  )
}

/** Cartoon UFO with glowing beam */
function SvgUFO({ uid = 0, width = 72 }) {
  const gid  = `ufo-dome-${uid}`
  const bgid = `ufo-body-${uid}`
  const bm   = `ufo-beam-${uid}`
  const h = Math.round(width * 0.72)
  return (
    <svg width={width} height={h} viewBox="0 0 80 58"
         xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id={gid} cx="40%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="rgba(160,230,255,0.95)" />
          <stop offset="60%"  stopColor="rgba(80,170,240,0.75)" />
          <stop offset="100%" stopColor="rgba(30,100,200,0.50)" />
        </radialGradient>
        <radialGradient id={bgid} cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#d0e8d0" />
          <stop offset="55%"  stopColor="#88b888" />
          <stop offset="100%" stopColor="#3a6a3a" />
        </radialGradient>
        <linearGradient id={bm} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"   stopColor="rgba(180,255,180,0.55)" />
          <stop offset="100%" stopColor="rgba(180,255,180,0.0)" />
        </linearGradient>
      </defs>
      {/* Tractor beam */}
      <path d="M30,34 L20,58 L60,58 L50,34 Z" fill={`url(#${bm})`} />
      {/* Saucer body */}
      <ellipse cx="40" cy="34" rx="34" ry="10" fill={`url(#${bgid})`} />
      <ellipse cx="40" cy="34" rx="34" ry="10" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      {/* Lights on rim */}
      {[10, 22, 34, 46, 58, 70].map((x, i) => (
        <circle key={i} cx={x} cy="34" r="2.2"
                fill={`hsl(${i * 60},90%,70%)`} opacity="0.9" />
      ))}
      {/* Dome */}
      <path d="M24,34 Q24,14 40,12 Q56,14 56,34 Z" fill={`url(#${gid})`} />
      <path d="M28,34 Q29,20 40,18 Q51,20 52,34" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
    </svg>
  )
}

/** Moon sphere with craters and terminator shading */
function SvgMoon({ uid = 0, width = 55 }) {
  const gid = `moon-rad-${uid}`
  return (
    <svg width={width} height={width} viewBox="0 0 54 54"
         xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <defs>
        <radialGradient id={gid} cx="36%" cy="32%" r="66%">
          <stop offset="0%"   stopColor="#f7f2dc" />
          <stop offset="45%"  stopColor="#d9cc8a" />
          <stop offset="100%" stopColor="#7a6b38" />
        </radialGradient>
      </defs>
      <circle cx="27" cy="27" r="24" fill={`url(#${gid})`} />
      {/* Large crater */}
      <circle cx="19" cy="21" r="5.5" fill="rgba(60,50,20,0.18)" />
      <circle cx="18.5" cy="20.5" r="4.5" fill="rgba(0,0,0,0.12)" />
      <circle cx="17" cy="19" r="1.2" fill="rgba(255,255,255,0.10)" />
      {/* Medium crater */}
      <circle cx="34" cy="31" r="3.8" fill="rgba(60,50,20,0.16)" />
      <circle cx="33.5" cy="30.5" r="3" fill="rgba(0,0,0,0.10)" />
      {/* Small crater */}
      <circle cx="26" cy="37" r="2.4" fill="rgba(60,50,20,0.14)" />
      <circle cx="25.5" cy="36.5" r="1.8" fill="rgba(0,0,0,0.09)" />
      {/* Terminator shadow */}
      <path d="M27,3 Q48,14 48,27 Q48,40 27,51 Q32,45 32,27 Q32,9 27,3 Z"
            fill="rgba(0,0,0,0.08)" />
      {/* Rim glow */}
      <circle cx="27" cy="27" r="24" fill="none"
              stroke="rgba(255,250,220,0.18)" strokeWidth="1.5" />
    </svg>
  )
}

/** Saturn-like ringed planet */
function SvgPlanet({ uid = 0, width = 68 }) {
  const gid  = `planet-body-${uid}`
  const rgid = `planet-ring-${uid}`
  const h = Math.round(width * 0.80)
  return (
    <svg width={width} height={h} viewBox="0 0 80 64"
         xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <defs>
        <radialGradient id={gid} cx="36%" cy="32%" r="64%">
          <stop offset="0%"   stopColor="#e9b07a" />
          <stop offset="50%"  stopColor="#c4783e" />
          <stop offset="100%" stopColor="#682e10" />
        </radialGradient>
        <radialGradient id={rgid} cx="50%" cy="50%" r="50%">
          <stop offset="30%"  stopColor="rgba(210,170,110,0.0)" />
          <stop offset="50%"  stopColor="rgba(210,170,110,0.55)" />
          <stop offset="72%"  stopColor="rgba(190,145,80,0.65)" />
          <stop offset="88%"  stopColor="rgba(170,125,60,0.30)" />
          <stop offset="100%" stopColor="rgba(170,125,60,0.0)" />
        </radialGradient>
      </defs>
      {/* Back ring */}
      <ellipse cx="40" cy="32" rx="36" ry="11" fill={`url(#${rgid})`} />
      {/* Planet */}
      <circle cx="40" cy="32" r="21" fill={`url(#${gid})`} />
      {/* Cloud bands */}
      <path d="M19,28 Q40,24 61,28"
            stroke="rgba(255,230,185,0.18)" strokeWidth="3.5" fill="none" />
      <path d="M20,36 Q40,33 60,36"
            stroke="rgba(0,0,0,0.13)" strokeWidth="2.5" fill="none" />
      <path d="M23,22 Q40,19 57,22"
            stroke="rgba(255,220,170,0.12)" strokeWidth="2" fill="none" />
      {/* Front ring strokes */}
      <ellipse cx="40" cy="32" rx="36" ry="11" fill="none"
               stroke="rgba(215,175,110,0.55)" strokeWidth="5" />
      {/* Occlude lower ring behind planet's bottom half */}
      <path d="M19,32 a21,21 0 0 0 42,0" fill={`url(#${gid})`} />
      {/* Atmosphere rim */}
      <circle cx="40" cy="32" r="21" fill="none"
              stroke="rgba(255,200,130,0.14)" strokeWidth="2.5" />
    </svg>
  )
}

/** Friendly cartoon rocket, drawn pointing RIGHT (horizontal flight).
 *  Flame flickers via the .rocket-flame class. */
function SvgRocket({ uid = 0, width = 84 }) {
  const bg  = `rocket-body-${uid}`
  const fg  = `rocket-flame-${uid}`
  const h = Math.round(width * 0.5)
  return (
    <svg width={width} height={h} viewBox="0 0 120 60"
         xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={bg} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="45%"  stopColor="#dfe7f5" />
          <stop offset="100%" stopColor="#9aa8c4" />
        </linearGradient>
        <linearGradient id={fg} x1="100%" y1="50%" x2="0%" y2="50%">
          <stop offset="0%"   stopColor="rgba(255,240,140,0.0)" />
          <stop offset="35%"  stopColor="rgba(255,180,40,0.85)" />
          <stop offset="100%" stopColor="rgba(255,90,20,0.95)" />
        </linearGradient>
      </defs>
      {/* Exhaust flame (points left, trailing behind) */}
      <g className="rocket-flame" style={{ transformOrigin: '24px 30px' }}>
        <path d="M24,22 Q-6,30 24,38 Q14,30 24,22 Z" fill={`url(#${fg})`} />
        <path d="M24,25 Q6,30 24,35 Q17,30 24,25 Z" fill="rgba(255,235,150,0.9)" />
      </g>
      {/* Rear fins */}
      <path d="M30,22 L18,10 L34,22 Z"  fill="#e0533a" />
      <path d="M30,38 L18,50 L34,38 Z"  fill="#e0533a" />
      {/* Body — nose to the right */}
      <path d="M24,22 L78,18 Q104,22 114,30 Q104,38 78,42 L24,38 Q18,30 24,22 Z"
            fill={`url(#${bg})`} stroke="rgba(70,90,130,0.45)" strokeWidth="1.5" />
      {/* Nose cone */}
      <path d="M88,19 Q104,22 114,30 Q104,38 88,41 Q98,30 88,19 Z" fill="#e0533a" />
      {/* Window */}
      <circle cx="58" cy="30" r="8" fill="#3aa0d8" stroke="#ffffff" strokeWidth="2.5" />
      <circle cx="55" cy="27" r="2.4" fill="rgba(255,255,255,0.85)" />
      {/* Body trim line */}
      <path d="M30,30 L86,30" stroke="rgba(70,90,130,0.30)" strokeWidth="1.4" />
    </svg>
  )
}

/** Generate SVG gear/cog path: n teeth, outer radius R, inner radius r */
function makeGearPath(n, R, r, cx, cy) {
  const step = (2 * Math.PI) / n
  const ht   = step * 0.26   // half-tooth angular width
  const pts  = []
  for (let i = 0; i < n; i++) {
    const c = i * step - Math.PI / 2   // centre angle, start at top
    pts.push([r, c - ht], [R, c - ht], [R, c + ht], [r, c + ht])
  }
  const xy = ([rad, a]) =>
    `${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`
  return 'M' + pts.map(xy).join(' L') + ' Z'
}

/** Rendered gear cog with depth gradient */
function SvgGear({ uid = 0, width = 40, teeth = 8, hue = 210 }) {
  const gid  = `gear-grad-${uid}`
  const path = useMemo(() => makeGearPath(teeth, 22, 15.5, 25, 25), [teeth])
  const fill = `hsla(${hue},78%,72%,0.92)`
  return (
    <svg width={width} height={width} viewBox="0 0 50 50"
         xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <defs>
        <radialGradient id={gid} cx="34%" cy="30%" r="68%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.38)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.24)" />
        </radialGradient>
      </defs>
      {/* Gear body */}
      <path d={path} fill={fill} />
      {/* Depth shading */}
      <path d={path} fill={`url(#${gid})`} opacity="0.55" />
      {/* Hub */}
      <circle cx="25" cy="25" r="8"   fill="rgba(0,0,0,0.45)" />
      <circle cx="25" cy="25" r="8"   fill="none"
              stroke="rgba(255,255,255,0.20)" strokeWidth="1" />
      {/* Centre pin */}
      <circle cx="25" cy="25" r="2.5" fill={fill} opacity="0.80" />
      {/* Outer rim line */}
      <path d={path} fill="none"
            stroke="rgba(255,255,255,0.10)" strokeWidth="0.8" />
    </svg>
  )
}

/** Friendly floating robot, front-on so it reads from either travel direction.
 *  Antenna light + eyes blink via the .bot-antenna-light / .bot-eye classes. */
function SvgBot({ uid = 0, width = 54, hue = 200 }) {
  const gid = `bot-body-${uid}`
  const h = Math.round(width * 1.05)
  const metalHi = `hsl(${hue},40%,82%)`
  const metalMid = `hsl(${hue},38%,64%)`
  const metalLo = `hsl(${hue},42%,42%)`
  const glow = `hsl(${(hue + 40) % 360},95%,62%)`
  return (
    <svg width={width} height={h} viewBox="0 0 60 64"
         xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={metalHi} />
          <stop offset="50%" stopColor={metalMid} />
          <stop offset="100%" stopColor={metalLo} />
        </linearGradient>
      </defs>
      {/* Antenna */}
      <line x1="30" y1="10" x2="30" y2="2" stroke={metalMid} strokeWidth="2" strokeLinecap="round" />
      <circle className="bot-antenna-light" cx="30" cy="2.5" r="3"
              fill={glow} style={{ transformOrigin: '30px 2.5px' }} />
      {/* Arms */}
      <rect x="2" y="30" width="7" height="4" rx="2" fill={metalMid} />
      <rect x="51" y="30" width="7" height="4" rx="2" fill={metalMid} />
      <circle cx="4" cy="32" r="3" fill={metalLo} />
      <circle cx="56" cy="32" r="3" fill={metalLo} />
      {/* Head / body shell */}
      <rect x="9" y="9" width="42" height="38" rx="13" fill={`url(#${gid})`}
            stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" />
      {/* Face screen */}
      <rect x="15" y="16" width="30" height="20" rx="9" fill="rgba(10,20,35,0.9)" />
      {/* Eyes */}
      <circle className="bot-eye" cx="24" cy="26" r="3.4" fill={glow}
              style={{ transformOrigin: '24px 26px' }} />
      <circle className="bot-eye" cx="36" cy="26" r="3.4" fill={glow}
              style={{ transformOrigin: '36px 26px', animationDelay: '0.15s' }} />
      {/* Smile */}
      <path d="M24,31 Q30,34 36,31" fill="none" stroke={glow} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
      {/* Body base / legs */}
      <rect x="16" y="46" width="28" height="12" rx="6" fill={metalMid}
            stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <rect x="20" y="50" width="6" height="9" rx="3" fill={metalLo} />
      <rect x="34" y="50" width="6" height="9" rx="3" fill={metalLo} />
      {/* Chest light */}
      <circle cx="30" cy="51.5" r="2.4" fill={glow} opacity="0.85" />
    </svg>
  )
}

// ─── Space: star field + flying objects ──────────────────────────────────────
function SpaceBackground() {
  const rand = useMemo(() => seededRand(42), [])
  const stars = useMemo(() => Array.from({ length: 80 }, (_, i) => ({
    id: i,
    top:     rand() * 100,
    left:    rand() * 100,
    size:    rand() * 2.5 + 0.5,
    dur:     rand() * 32 + 16,
    delay:   -(rand() * 24),
    opacity: rand() * 0.7 + 0.3,
    tail:    rand() > 0.85,
  })), [])

  // Rockets cruising past — art now uses the new themed PNG/SVG artwork,
  // rotated 90° so the nose points along the direction of travel.
  const rockets = [
    { uid: 1, top: 18, dur: 60,  delay: -10,  width: 80, src: '/themes/Space/bg-images/rocket.svg' },
    { uid: 3, top: 42, dur: 130, delay: -70,  width: 28, src: '/themes/Space/bg-images/rocket.svg',     far: true },
  ]

  // Satellites passing through occasionally
  const satellites = [
    { uid: 1, top: 38, dur: 70,  delay: -30, width: 62, src: '/themes/Space/bg-images/space-satellite.svg' },
  ]

  // UFOs — some left→right, some right→left
  const ufos = [
    { uid: 2, top: 26, dur: 95,  delay: -20, width: 50, src: '/themes/Space/bg-images/ufo (1).svg' },
    { uid: 3, top: 50, dur: 160, delay: -90, width: 20, reverse: true, src: '/themes/Space/bg-images/ufo.svg',     far: true },
  ]

  return (
    <div className="bg bg-space">
      {stars.map(s => (
        <div key={s.id} className={`star${s.tail ? ' tail' : ''}`} style={{
          top:    `${s.top}%`,
          left:   `${s.left}%`,
          width:  `${s.size}px`,
          height: s.tail ? `${s.size * 0.6}px` : `${s.size}px`,
          animationDuration: `${s.dur}s`,
          animationDelay:    `${s.delay}s`,
          opacity: s.opacity,
        }} />
      ))}

      {/* Rockets flying across, nose rotated 90° to face the direction of travel */}
      {rockets.map(r => (
        <div key={`rk${r.uid}`} className={`space-rocket${r.reverse ? ' reverse' : ''}`} style={{
          top: `${r.top}%`,
          animationDuration: `${r.dur}s`,
          animationDelay: `${r.delay}s`,
          ...(r.far ? { opacity: 0.55, filter: 'blur(0.5px)' } : {}),
        }}>
          <div className="space-rocket-bob">
            <img src={r.src} alt="" width={r.width}
                 style={{ display: 'block', transform: r.reverse ? 'rotate(-135deg)' : 'rotate(45deg)' }} />
          </div>
        </div>
      ))}

      {/* Satellites flying left → right */}
      {satellites.map(s => (
        <div key={`sat${s.uid}`} className="space-satellite" style={{
          top: `${s.top}%`,
          animationDuration: `${s.dur}s`,
          animationDelay: `${s.delay}s`,
          ...(s.far ? { opacity: 0.5, filter: 'blur(0.4px)' } : {}),
        }}>
          <div className="space-rocket-bob">
            <img src={s.src} alt="" width={s.width} style={{ display: 'block' }} />
          </div>
        </div>
      ))}

      {/* UFOs — some left→right, some right→left */}
      {ufos.map(u => (
        <div key={`ufo${u.uid}`} className={`space-ufo${u.reverse ? ' reverse' : ''}`} style={{
          top: `${u.top}%`,
          animationDuration: `${u.dur}s`,
          animationDelay: `${u.delay}s`,
          ...(u.far ? { opacity: 0.5, filter: 'blur(0.5px)' } : {}),
        }}>
          <div className="space-ufo-bob">
            <img src={u.src} alt="" width={u.width} style={{ display: 'block' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Gliding Pteranodon, viewed from below and facing right — long beak, swept
 *  head crest, trailing legs and big pointed membrane wings that flap slowly
 *  via the .dino-wing-l / .dino-wing-r classes. */
function SvgPterosaur({ width = 76, flapDur = 2.4, flapDelay = 0, fill = 'rgba(30,11,4,0.84)', fillHi = 'rgba(46,20,8,0.84)' }) {
  const w = width, h = Math.round(width * 0.5)
  return (
    <svg width={w} height={h} viewBox="0 0 80 40"
         xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', overflow: 'visible' }}>
      {/* Left wing — one membrane: leading edge to the tip, then a single
          concave trailing edge sweeping back to the body */}
      <g className="dino-wing dino-wing-l"
         style={{ transformOrigin: '37px 17px', animationDuration: `${flapDur}s`, animationDelay: `${flapDelay}s` }}>
        <path d="M37,16 C27,9 13,6 3,10 C10,15 18,19 25,23 C30,21 34,19 37,18 Z" fill={fillHi} />
      </g>
      {/* Right wing */}
      <g className="dino-wing dino-wing-r"
         style={{ transformOrigin: '43px 17px', animationDuration: `${flapDur}s`, animationDelay: `${flapDelay}s` }}>
        <path d="M43,16 C53,9 67,6 77,10 C70,15 62,19 55,23 C50,21 46,19 43,18 Z" fill={fillHi} />
      </g>
      {/* Body with trailing splayed legs */}
      <path d="M36,17 Q40,15 44,17 Q44,22 41,27 L43,33 L40,28 L37,33 L39,26 Q36,21 36,17 Z" fill={fill} />
      {/* Head — swept crest (back-left) and long beak (right) */}
      <path d="M33,9 Q42,12 45,16 L67,15.4 L46,18.6 Q43,18 41,17 Q37,14 33,9 Z" fill={fill} />
    </svg>
  )
}

// Flat-icon friends for the Dino and Robot worlds (same style as Space & Sea)
// flip: the picture faces left, so mirror it when walking right
const DINO_WALKERS = [
  { id: 1, src: '/themes/Dino/brachio.png',    width: 84, bottom: 2, dur: 160, delay: -20,  flip: true },
  { id: 2, src: '/themes/Dino/stego.png',      width: 72, bottom: 3, dur: 190, delay: -120, flip: true },
  { id: 3, src: '/themes/Dino/mem-raptor.png', width: 40, bottom: 13, dur: 240, delay: -60, reverse: true, far: true, flip: true },
]
const ROBOT_FLOATERS = [
  '/themes/Robots/mem-drone.png',
  '/themes/Robots/head-dot.png',
  '/themes/Robots/head-pixel.png',
  '/themes/Robots/mem-windup.png',
]
const ROBOT_WALKERS = [
  { id: 1, src: '/themes/Robots/mem-robodog.png', width: 66, bottom: 2, dur: 140, delay: -40 },
  { id: 2, src: '/themes/Robots/mem-vacuum.png',  width: 54, bottom: 2, dur: 200, delay: -130, reverse: true },
]

// ─── Dinosaurs: volcano + falling ash/embers ─────────────────────────────────
function DinoBackground() {
  const rand = useMemo(() => seededRand(99), [])
  const embers = useMemo(() => Array.from({ length: 35 }, (_, i) => ({
    id: i,
    left:  rand() * 100,
    dur:   rand() * 12 + 10,
    delay: -(rand() * 10),
    size:  rand() * 6 + 3,
    sway:  rand() * 40 - 20,
    hot:   rand() > 0.5,
  })), [])

  // Pterosaurs gliding across the sky (creatures)
  const pteros = useMemo(() => Array.from({ length: 4 }, (_, i) => {
    const far = i >= 2
    return {
      id:       i,
      top:      rand() * 32 + 5,
      width:    far ? Math.round(rand() * 14 + 42) : Math.round(rand() * 24 + 72),
      dur:      far ? rand() * 40 + 95 : rand() * 30 + 60,
      delay:    -(rand() * 70),
      reverse:  i % 2 === 1,
      flapDur:  +(rand() * 1.2 + 2).toFixed(2),
      flapDelay:+(-(rand() * 1.5)).toFixed(2),
      bobDur:   +(rand() * 3 + 5).toFixed(2),
      far,
    }
  }), [])

  return (
    <div className="bg bg-dino">
      <div className="dino-sky-glow" />

      {/* Distant silhouette scenery: hills, a glowing volcano, jungle palms and
          standing dinosaurs on the horizon — adds depth behind the haze. */}
      <div className="dino-scenery">
        <svg viewBox="0 0 1440 360" preserveAspectRatio="xMidYMax slice"
             xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
          {/* Far hill ridge */}
          <path d="M0,360 L0,250 Q180,205 360,235 Q520,262 700,225 Q900,185 1100,228 Q1290,262 1440,230 L1440,360 Z"
                fill="rgba(40,14,4,0.55)" />
          {/* Volcano cone */}
          <path d="M250,360 L470,360 L392,150 Q360,120 328,150 Z" fill="rgba(26,9,3,0.78)" />
          {/* Volcano glowing crater + lava trickle */}
          <path d="M338,156 Q360,138 382,156 Q372,168 360,168 Q348,168 338,156 Z" fill="rgba(255,120,20,0.85)" />
          <path d="M356,162 Q352,210 366,250 Q374,210 364,162 Z" fill="rgba(255,90,20,0.5)" />
          {/* Long-neck sauropod silhouette on the ridge (left) */}
          <g fill="rgba(20,7,2,0.8)" transform="translate(120,196)">
            <path d="M0,70 Q6,30 26,26 Q34,8 44,10 Q40,18 36,26 Q60,28 78,52 L90,52 Q96,40 104,52 L112,70 Z" />
            <path d="M40,52 L36,70 M70,56 L70,72 M92,56 L94,72" stroke="rgba(20,7,2,0.8)" strokeWidth="6" />
          </g>
          {/* Stegosaurus-ish silhouette on the ridge (right) */}
          <g fill="rgba(18,6,2,0.82)" transform="translate(960,214)">
            <path d="M0,56 Q14,40 36,42 Q54,18 88,30 Q104,36 110,52 L118,56 L112,56 Q104,46 96,52 L92,56 L20,56 Q10,52 0,56 Z" />
            <path d="M30,40 l8,-14 8,14 z M46,34 l9,-16 9,16 z M64,32 l9,-15 9,15 z" />
          </g>
          {/* Jungle palm silhouettes for foreground depth */}
          <g fill="rgba(12,5,2,0.85)">
            <g transform="translate(40,360)">
              <rect x="-4" y="-110" width="8" height="110" rx="3" />
              <path d="M0,-108 Q-44,-128 -70,-110 Q-40,-118 0,-104 Z" />
              <path d="M0,-108 Q44,-128 70,-110 Q40,-118 0,-104 Z" />
              <path d="M0,-110 Q-26,-150 -44,-150 Q-20,-138 0,-106 Z" />
              <path d="M0,-110 Q26,-150 44,-150 Q20,-138 0,-106 Z" />
            </g>
            <g transform="translate(1380,360) scale(1.2)">
              <rect x="-4" y="-110" width="8" height="110" rx="3" />
              <path d="M0,-108 Q-44,-128 -70,-110 Q-40,-118 0,-104 Z" />
              <path d="M0,-108 Q44,-128 70,-110 Q40,-118 0,-104 Z" />
              <path d="M0,-110 Q-26,-150 -44,-150 Q-20,-138 0,-106 Z" />
              <path d="M0,-110 Q26,-150 44,-150 Q20,-138 0,-106 Z" />
            </g>
          </g>
        </svg>
      </div>

      {/* Drifting ash-fog (replaces the old triangle landscape overlay) */}
      <div className="dino-ashfog fog1" />
      <div className="dino-ashfog fog2" />
      <div className="dino-ashfog fog3" />

      {/* Pterosaurs gliding across the sky */}
      {pteros.map(p => (
        <div key={`pt${p.id}`} className={`dino-ptero${p.reverse ? ' reverse' : ''}`} style={{
          top: `${p.top}%`,
          animationDuration: `${p.dur}s`,
          animationDelay: `${p.delay}s`,
          ...(p.far ? { opacity: 0.55, filter: 'blur(0.5px)' } : {}),
        }}>
          <div className="dino-ptero-bob" style={{ animationDuration: `${p.bobDur}s` }}>
            <div className="dino-ptero-img" style={{ animationDuration: `${p.flapDur}s`, animationDelay: `${p.flapDelay}s` }}>
              {/* picture faces left — mirrored so it flies forwards */}
              <img src="/themes/Dino/ptero.png" alt="" width={p.width} style={{ display: 'block', transform: 'scaleX(-1)' }} />
            </div>
          </div>
        </div>
      ))}

      {/* Friendly dinosaurs strolling along the bottom */}
      {DINO_WALKERS.map(w => (
        <div key={`dw${w.id}`} className={`bg-walker${w.reverse ? ' reverse' : ''}`} style={{
          bottom: `${w.bottom}%`,
          animationDuration: `${w.dur}s`,
          animationDelay: `${w.delay}s`,
          ...(w.far ? { opacity: 0.6, filter: 'blur(0.4px)' } : {}),
        }}>
          <div className="bg-walker-step">
            <img src={w.src} alt="" width={w.width}
                 style={{ display: 'block', transform: w.flip ? 'scaleX(-1)' : undefined }} />
          </div>
        </div>
      ))}

      {embers.map(e => (
        <div key={e.id} className={`ember${e.hot ? ' hot' : ''}`} style={{
          left:   `${e.left}%`,
          width:  `${e.size}px`,
          height: `${e.size}px`,
          animationDuration: `${e.dur}s`,
          animationDelay:    `${e.delay}s`,
          '--sway': `${e.sway}px`,
        }} />
      ))}
    </div>
  )
}

// ─── Nature: scrolling parallax landscape ────────────────────────────────────

function terrainPath(seed, width, viewH, groundFrac, peaks, minFrac, maxFrac) {
  const rand = seededRand(seed)
  const gY   = Math.round(viewH * groundFrac)
  const edgeT = minFrac + rand() * (maxFrac - minFrac) * 0.4
  const edgeY = Math.round(gY * (1 - edgeT))
  const pts   = [{ x: 0, y: edgeY }]
  for (let i = 1; i < peaks; i++) {
    const x = Math.round((i / peaks) * width)
    const t = minFrac + rand() * (maxFrac - minFrac)
    pts.push({ x, y: Math.round(gY * (1 - t)) })
  }
  pts.push({ x: width, y: edgeY })
  let d = `M0,${viewH} L0,${edgeY}`
  for (let i = 1; i < pts.length; i++) {
    const cx = Math.round((pts[i-1].x + pts[i].x) / 2)
    d += ` C${cx},${pts[i-1].y} ${cx},${pts[i].y} ${pts[i].x},${pts[i].y}`
  }
  d += ` L${width},${viewH} Z`
  return d
}

/** One wavy wind-streak path — oscillates above/below baseY each segment */
function makeWindStreak(rand, width, baseY) {
  let d = `M0,${baseY.toFixed(1)}`
  let x = 0, dir = 1
  while (x < width) {
    const segW = 80 + rand() * 130
    const nx   = x + segW
    const amp  = 4 + rand() * 13
    const cx   = x + segW * 0.5
    d += ` Q${cx.toFixed(1)},${(baseY - dir * amp).toFixed(1)} ${nx.toFixed(1)},${baseY.toFixed(1)}`
    dir = -dir
    x  = nx
  }
  return d
}

/** Build an array of wind-streak descriptors for one SVG layer */
function makeWindLayer(seed, width, viewH, count) {
  const rand = seededRand(seed)
  return Array.from({ length: count }, (_, i) => ({
    id:          i,
    d:           makeWindStreak(
                   rand, width,
                   (viewH * (i + 0.5)) / count + (rand() - 0.5) * (viewH / count * 0.25)
                 ),
    opacity:     0.05 + rand() * 0.11,
    strokeWidth: 0.8 + rand() * 2.6,
  }))
}

function NatureBackground() {
  const farWind  = useMemo(() => makeWindLayer(88, 1440, 300, 8), [])
  const nearWind = useMemo(() => makeWindLayer(99, 1440, 260, 7), [])

  const rand  = useMemo(() => seededRand(17), [])

  // Load the flapping-bird Lottie once; birds render after it arrives.
  const [birdData, setBirdData] = useState(null)
  useEffect(() => {
    let alive = true
    fetch(BIRD_LOTTIE_URL)
      .then(r => r.json())
      .then(d => { if (alive) setBirdData(d) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  const birds = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    // The sky is mostly hand-drawn soaring white gulls, with just one occasional
    // Lottie flapping bird mixed in. They need different sizing (the Lottie sits
    // in a 16:9 frame).
    const kind = i === 3 ? 'lottie' : 'gull'
    const base = {
      id:       i,
      kind,
      top:      rand() * 34 + 3,
      dur:      (rand() * 42 + 24) * 1.3,
      delay:    -(rand() * 30),
      // vertical bob amplitude + period for an undulating flight path
      bobAmp:   Math.round(rand() * 10 + 8),
      bobDur:   +(rand() * 3 + 4).toFixed(2),
      bobDelay: +(-(rand() * 4)).toFixed(2),
    }
    if (kind === 'gull') {
      const width = Math.round(rand() * 16 + 24)   // 24–40 px silhouette
      return {
        ...base, width,
        flapDur:   +(0.55 + (width - 24) / 18 * 0.35 + rand() * 0.25).toFixed(2),
        flapDelay: +(-(rand() * 0.9)).toFixed(2),
      }
    }
    // lottie bird — `width` sizes its (mostly transparent) 16:9 frame
    const width = Math.round(rand() * 120 + 170)   // 170–290 px frame
    return {
      ...base, width,
      speed:      +(0.85 + rand() * 0.5).toFixed(2),
      startFrame: Math.round(rand() * 31),
    }
  }), [])

  const blades = useMemo(() => {
    const r = seededRand(44)
    return Array.from({ length: 60 }, (_, i) => ({
      id:    i,
      x:     r() * 100,
      h:     Math.round(r() * 42 + 18),
      lean:  Math.round((r() - 0.5) * 14),
      dur:   +(r() * 2 + 2.5).toFixed(2),
      delay: +(-(r() * 5)).toFixed(2),
      col:   `rgba(${30 + Math.round(r() * 20)},${88 + Math.round(r() * 42)},${12 + Math.round(r() * 14)},${(0.5 + r() * 0.3).toFixed(2)})`,
    }))
  }, [])

  const cloudCx = [150, 480, 870, 1240]
  const cloudR  = [72, 58, 88, 50]
  const cloudOp = [0.70, 0.58, 0.66, 0.52]

  return (
    <div className="bg bg-nature">
      {/* Clouds */}
      <div className="nature-layer layer-clouds">
        {[0, 1].map(k => (
          <svg key={k} viewBox="0 0 1440 110" preserveAspectRatio="none"
               xmlns="http://www.w3.org/2000/svg"
               style={{ width: '50%', flexShrink: 0, height: '100%' }}>
            {cloudCx.map((cx, i) => {
              const r = cloudR[i], op = cloudOp[i]
              return (
                <g key={i}>
                  <ellipse cx={cx}            cy={70}             rx={r}        ry={r * 0.40} fill={`rgba(255,255,255,${op})`} />
                  <ellipse cx={cx + r * 0.28} cy={70 - r * 0.20} rx={r * 0.62} ry={r * 0.36} fill={`rgba(255,255,255,${Math.min(op + 0.06, 0.92)})`} />
                  <ellipse cx={cx - r * 0.33} cy={70 + r * 0.06} rx={r * 0.50} ry={r * 0.30} fill={`rgba(255,255,255,${Math.max(op - 0.10, 0.30)})`} />
                </g>
              )
            })}
          </svg>
        ))}
      </div>

      {/* Far wind streaks — slow, high, whitish */}
      <div className="nature-layer layer-wind-far">
        {[0, 1].map(k => (
          <svg key={k} viewBox="0 0 1440 300" preserveAspectRatio="none"
               xmlns="http://www.w3.org/2000/svg"
               style={{ width: '50%', flexShrink: 0, height: '100%' }}>
            {farWind.map(w => (
              <path key={w.id} d={w.d} fill="none"
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth={w.strokeWidth}
                    strokeLinecap="round"
                    opacity={w.opacity} />
            ))}
          </svg>
        ))}
      </div>

      {/* Near wind streaks — slightly faster, greenish tint */}
      <div className="nature-layer layer-wind-near">
        {[0, 1].map(k => (
          <svg key={k} viewBox="0 0 1440 260" preserveAspectRatio="none"
               xmlns="http://www.w3.org/2000/svg"
               style={{ width: '50%', flexShrink: 0, height: '100%' }}>
            {nearWind.map(w => (
              <path key={w.id} d={w.d} fill="none"
                    stroke="rgba(210,235,210,0.85)"
                    strokeWidth={w.strokeWidth}
                    strokeLinecap="round"
                    opacity={w.opacity} />
            ))}
          </svg>
        ))}
      </div>

      {/* Ground strip */}
      <div className="nature-ground" />

      {/* Swaying grass blades */}
      <div className="nature-grass-strip">
        {blades.map(b => (
          <div key={b.id} className="grass-blade" style={{
            left:              `${b.x}%`,
            height:            `${b.h}px`,
            '--lean':          `${b.lean}deg`,
            animationDuration: `${b.dur}s`,
            animationDelay:    `${b.delay}s`,
          }}>
            <svg width="5" height={b.h} viewBox={`0 0 5 ${b.h}`}
                 xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
              <path d={`M2.5,${b.h} C1.5,${(b.h * 0.7).toFixed(0)} 4,${(b.h * 0.3).toFixed(0)} 2.5,0`}
                    fill="none" stroke={b.col} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        ))}
      </div>

      {/* Birds — outer div flies horizontally, inner div bobs up/down. Gulls use
          the hand-drawn SVG (CSS wing flap); the rest use the Lottie, which only
          appears once its animation has loaded. */}
      {birds.map(b => {
        if (b.kind === 'lottie' && !birdData) return null
        return (
          <div key={b.id} className="nature-bird" style={{
            top:               `${b.top}%`,
            animationDuration: `${b.dur}s`,
            animationDelay:    `${b.delay}s`,
          }}>
            <div className="nature-bird-bob" style={{
              '--bob': `${b.bobAmp}px`,
              animationDuration: `${b.bobDur}s`,
              animationDelay:    `${b.bobDelay}s`,
            }}>
              {b.kind === 'gull'
                ? <SvgBird width={b.width} flapDur={b.flapDur} flapDelay={b.flapDelay} />
                : <LottieBird data={birdData} width={b.width} speed={b.speed} startFrame={b.startFrame} faceRight />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Robots: floating gears + drifting binary ────────────────────────────────
function RobotsBackground() {
  const rand  = useMemo(() => seededRand(55), [])
  const gears = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    id:      i,
    teeth:   Math.round(rand() * 6 + 6),          // 6–12 teeth
    top:     rand() * 90,
    left:    rand() * 100,
    width:   Math.round(rand() * 30 + 26),         // 26–56 px
    dur:     rand() * 40 + 30,
    delay:   -(rand() * 20),
    spinDur: rand() * 16 + 8,
    dir:     rand() > 0.5 ? 1 : -1,
    hue:     Math.round(rand() * 60 + 188),        // 188–248 (blue → cyan)
  })), [])

  const bits = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id:      i,
    text:    Math.random() > 0.5 ? '1' : '0',
    left:    rand() * 100,
    dur:     rand() * 16 + 12,
    delay:   -(rand() * 10),
    opacity: rand() * 0.3 + 0.1,
  })), [])

  // Friendly robots drifting across at varying depths (creatures)
  const bots = useMemo(() => Array.from({ length: 4 }, (_, i) => {
    const far = i >= 2
    return {
      id:      i,
      top:     rand() * 64 + 8,
      width:   far ? Math.round(rand() * 12 + 46) : Math.round(rand() * 22 + 80),
      dur:     far ? rand() * 40 + 90 : rand() * 30 + 55,
      delay:   -(rand() * 60),
      reverse: i % 2 === 0,
      hue:     Math.round(rand() * 80 + 180),
      bobDur:  +(rand() * 2 + 3).toFixed(2),
      far,
    }
  }), [])

  // Blinking circuit nodes pinned around the scene for depth (atmosphere)
  const nodes = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id:      i,
    top:     rand() * 92 + 2,
    left:    rand() * 96 + 2,
    size:    rand() * 4 + 3,
    dur:     +(rand() * 2.5 + 1.8).toFixed(2),
    delay:   +(-(rand() * 3)).toFixed(2),
    hue:     Math.round(rand() * 80 + 180),
  })), [])

  return (
    <div className="bg bg-robots">
      <div className="circuit-grid" />
      {/* Slow diagonal light sweep for ambient depth */}
      <div className="robot-scan" />

      {/* Blinking circuit nodes */}
      {nodes.map(n => (
        <div key={`node${n.id}`} className="robot-node" style={{
          top:    `${n.top}%`,
          left:   `${n.left}%`,
          width:  `${n.size}px`,
          height: `${n.size}px`,
          color:  `hsl(${n.hue},95%,62%)`,
          animationDuration: `${n.dur}s`,
          animationDelay:    `${n.delay}s`,
        }} />
      ))}
      {gears.map(g => (
        <div key={g.id} className="gear" style={{
          top:    `${g.top}%`,
          left:   `${g.left}%`,
          width:  `${g.width}px`,
          animationDuration: `${g.dur}s`,
          animationDelay:    `${g.delay}s`,
          '--spin-dur': `${g.spinDur}s`,
          '--spin-dir': g.dir,
        }}>
          <SvgGear uid={g.id} width={g.width} teeth={g.teeth} hue={g.hue} />
        </div>
      ))}
      {bits.map(b => (
        <div key={b.id} className="bit" style={{
          left:    `${b.left}%`,
          animationDuration: `${b.dur}s`,
          animationDelay:    `${b.delay}s`,
          opacity: b.opacity,
        }}>
          {b.text}
        </div>
      ))}

      {/* Friendly robots floating across the scene */}
      {bots.map(b => (
        <div key={`bot${b.id}`} className={`robot-bot${b.reverse ? ' reverse' : ''}`} style={{
          top: `${b.top}%`,
          animationDuration: `${b.dur}s`,
          animationDelay: `${b.delay}s`,
          ...(b.far ? { opacity: 0.55, filter: 'blur(0.6px)' } : {}),
        }}>
          <div className="robot-bot-bob" style={{ animationDuration: `${b.bobDur}s` }}>
            <img src={ROBOT_FLOATERS[b.id % ROBOT_FLOATERS.length]} alt="" width={b.width}
                 style={{ display: 'block' }} />
          </div>
        </div>
      ))}

      {/* Robot dog trotting along the bottom */}
      {ROBOT_WALKERS.map(w => (
        <div key={`rw${w.id}`} className={`bg-walker${w.reverse ? ' reverse' : ''}`} style={{
          bottom: `${w.bottom}%`,
          animationDuration: `${w.dur}s`,
          animationDelay: `${w.delay}s`,
        }}>
          <div className="bg-walker-step">
            <img src={w.src} alt="" width={w.width}
                 style={{ display: 'block', transform: w.flip ? 'scaleX(-1)' : undefined }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Sea: rising bubbles + drifting fish ─────────────────────────────────────
function SeaBackground() {
  const rand    = useMemo(() => seededRand(33), [])
  const bubbles = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id:    i,
    left:  rand() * 100,
    size:  rand() * 16 + 4,
    dur:   rand() * 16 + 10,
    delay: -(rand() * 12),
    sway:  rand() * 30 - 15,
  })), [])

  const ANGLER_IDX = FISH_IMAGES.findIndex(src => src.includes('angler'))

  const fish = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const width = Math.round(rand() * 26 + 26)     // 26–52 px (more variety)
    const species = i % FISH_IMAGES.length          // cycle through the fish silhouettes
    const isAngler = species === ANGLER_IDX
    return {
      id:         i,
      hue:        Math.round(rand() * 300),         // 0–300 (rich spectrum)
      species,
      // anglerfish lurks deep near the sea floor; others roam freely
      top:        isAngler ? (rand() * 12 + 82) : rand() * 78,
      width,
      // anglerfish drifts much more slowly than the rest of the school
      dur:        isAngler ? (rand() * 30 + 70) : (rand() * 30 + 20),
      delay:      -(rand() * 15),
      // two of the eight swim the other way (right-to-left -> left-to-right)
      reverse:    i % 4 === 0,
      // smaller fish flick their tails faster; jitter keeps the school natural
      swishDur:   +(0.45 + (52 - width) / 22 * 0.35 + rand() * 0.2).toFixed(2),
      swishDelay: +(-(rand() * 0.6)).toFixed(2),
      bobAmp:     Math.round(rand() * 8 + 5),
      bobDur:     +(rand() * 2.5 + 3.5).toFixed(2),
      bobDelay:   +(-(rand() * 3)).toFixed(2),
    }
  }), [])

  // A few drifting jellyfish — slow vertical bob + horizontal sway
  const jellies = useMemo(() => Array.from({ length: 3 }, (_, i) => ({
    id:     i,
    left:   rand() * 90 + 3,
    top:    rand() * 50 + 8,
    width:  Math.round(rand() * 18 + 30),
    hue:    Math.round(rand() * 80 + 260),         // pink → violet
    dur:    +(rand() * 6 + 10).toFixed(2),
    delay:  +(-(rand() * 8)).toFixed(2),
    pulse:  +(rand() * 1.5 + 2.5).toFixed(2),
  })), [])

  // Seaweed clumps swaying along the floor
  const weeds = useMemo(() => Array.from({ length: 9 }, (_, i) => ({
    id:    i,
    left:  rand() * 96 + 1,
    h:     Math.round(rand() * 60 + 50),
    hue:   Math.round(rand() * 30 + 120),
    dur:   +(rand() * 2.5 + 3.5).toFixed(2),
    delay: +(-(rand() * 4)).toFixed(2),
    flip:  rand() > 0.5,
  })), [])

  return (
    <div className="bg bg-sea">
      <div className="sea-caustics" />
      <div className="sea-floor" />

      {/* Swaying seaweed along the floor */}
      <div className="sea-weeds">
        {weeds.map(w => {
          const sway = w.h * 0.18
          return (
            <div key={w.id} className="seaweed" style={{
              left:              `${w.left}%`,
              animationDuration: `${w.dur}s`,
              animationDelay:    `${w.delay}s`,
            }}>
              <svg width={Math.round(w.h * 0.4)} height={w.h}
                   viewBox={`0 0 ${Math.round(w.h * 0.4)} ${w.h}`}
                   xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                <path d={`M${(w.h * 0.2).toFixed(0)},${w.h}
                          C${(w.h * 0.2 - sway).toFixed(0)},${(w.h * 0.7).toFixed(0)}
                           ${(w.h * 0.2 + sway).toFixed(0)},${(w.h * 0.35).toFixed(0)}
                           ${(w.h * 0.2).toFixed(0)},0`}
                      fill="none" stroke={`hsla(${w.hue},65%,42%,0.7)`}
                      strokeWidth="5" strokeLinecap="round" />
                <path d={`M${(w.h * 0.2).toFixed(0)},${w.h}
                          C${(w.h * 0.2 + sway).toFixed(0)},${(w.h * 0.72).toFixed(0)}
                           ${(w.h * 0.2 - sway * 0.6).toFixed(0)},${(w.h * 0.4).toFixed(0)}
                           ${(w.h * 0.2).toFixed(0)},${(w.h * 0.1).toFixed(0)}`}
                      fill="none" stroke={`hsla(${w.hue},70%,52%,0.55)`}
                      strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          )
        })}
      </div>

      {bubbles.map(b => (
        <div key={b.id} className="bubble" style={{
          left:   `${b.left}%`,
          width:  `${b.size}px`,
          height: `${b.size}px`,
          animationDuration: `${b.dur}s`,
          animationDelay:    `${b.delay}s`,
          '--sway': `${b.sway}px`,
        }} />
      ))}
      {fish.map(f => (
        // Outer div: drives the fish-swim animation (horizontal travel).
        //   `.reverse` flips the travel direction (left-to-right).
        // Bob div:   gentle independent vertical bob.
        // Facing div: mirrors the SVG so fish always face the way they swim.
        //   Default art faces right; default travel is leftward, so we flip
        //   to face left. Reversed fish travel rightward, so they keep the
        //   default (right-facing) orientation — no flip.
        <div key={f.id} className={`fish${f.reverse ? ' reverse' : ''}`} style={{
          top:   `${f.top}%`,
          animationDuration: `${f.dur}s`,
          animationDelay:    `${f.delay}s`,
        }}>
          <div className="fish-bob" style={{
            '--bob': `${f.bobAmp}px`,
            animationDuration: `${f.bobDur}s`,
            animationDelay:    `${f.bobDelay}s`,
          }}>
            <div style={{
              transform: (f.reverse !== FISH_FACES_LEFT[f.species]) ? 'none' : 'scaleX(-1)',
              display: 'inline-block',
            }}>
              <img src={FISH_IMAGES[f.species]} alt="" width={f.width}
                   style={{ display: 'block', height: 'auto' }} />
            </div>
          </div>
        </div>
      ))}

      {/* Drifting jellyfish */}
      {jellies.map(j => (
        <div key={`j${j.id}`} className="sea-jelly" style={{
          left:              `${j.left}%`,
          top:               `${j.top}%`,
          animationDuration: `${j.dur}s`,
          animationDelay:    `${j.delay}s`,
        }}>
          <div className="sea-jelly-pulse" style={{ animationDuration: `${j.pulse}s` }}>
            <SvgJelly uid={j.id} width={j.width} hue={j.hue} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
const BG_MAP = {
  space:     SpaceBackground,
  dinosaurs: DinoBackground,
  animals:   NatureBackground,
  robots:    RobotsBackground,
  sea:       SeaBackground,
}

export default function BackgroundAnimation() {
  const { themeId } = useTheme()
  const Component = BG_MAP[themeId]
  return Component ? <Component key={themeId} /> : null
}
