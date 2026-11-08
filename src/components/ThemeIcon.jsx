// Custom SVG icon for each theme — replaces the emoji in the menu header and sidebar logo

// ─── Animals: theme icon (custom SVG asset) ──────────────────────────────────
function LionIcon({ size }) {
  return (
    <img src="/themes/Animals/head-fox.png" alt="fox"
         style={{ width: size, height: size, objectFit: 'contain', display: 'block', flexShrink: 0 }} />
  )
}

// ─── Dinosaurs: theme icon (custom SVG asset) ────────────────────────────────
function TRexIcon({ size }) {
  return (
    <img src="/themes/Dino/head-fox.png" alt="dinosaur"
         style={{ width: size, height: size, objectFit: 'contain', display: 'block', flexShrink: 0 }} />
  )
}

// ─── Space: Rocket (custom SVG asset) ────────────────────────────────────────
function RocketIcon({ size }) {
  return (
    <img src="/themes/Space/head-fox.png" alt="space ship"
         style={{ width: size, height: size, objectFit: 'contain', display: 'block', flexShrink: 0 }} />
  )
}

// ─── Robots: Robot icon (custom SVG asset) ───────────────────────────────────
function RobotIcon({ size }) {
  return (
    <img src="/themes/Robots/head-fox.png" alt="robot"
         style={{ width: size, height: size, objectFit: 'contain', display: 'block', flexShrink: 0 }} />
  )
}

// ─── Sea: Octopus (custom SVG asset) ─────────────────────────────────────────
function OctopusIcon({ size }) {
  return (
    <img src="/themes/Underwater/head-fox.png" alt="octopus"
         style={{ width: size, height: size, objectFit: 'contain', display: 'block', flexShrink: 0 }} />
  )
}


// ─── Main export ──────────────────────────────────────────────────────────────
export default function ThemeIcon({ themeId, size = 56 }) {
  switch (themeId) {
    case 'animals':   return <LionIcon   size={size} />
    case 'dinosaurs': return <TRexIcon   size={size} />
    case 'space':     return <RocketIcon size={size} />
    case 'robots':    return <RobotIcon  size={size} />
    case 'sea':       return <OctopusIcon size={size} />
    default:          return null
  }
}
