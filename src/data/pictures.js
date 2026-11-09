// The painted pictures of each world (public/themes/<folder>/*.png).
// Used by Memory (one world at a time) and Mahjong (a mix of all worlds).
export const WORLD_PICTURES = {
  animals: {
    folder: 'Animals', color: '#ffd966', bg: '#2e2200',
    files: [
      'head-buffalo.png', 'head-sloth.png', 'head-gorilla.png', 'mem-raccoon.png',
      'mem-koala.png', 'mem-owl.png', 'mem-giraffe.png', 'mem-tiger.png',
      'mem-parrot.png', 'mem-kangaroo.png', 'mem-bee.png', 'mem-walrus.png',
    ],
  },
  dinosaurs: {
    folder: 'Dino', color: '#ffcf80', bg: '#2e1c00',
    files: [
      'head-spino.png', 'head-para.png', 'head-trice.png', 'trex.png',
      'stego.png', 'ptero.png', 'egg.png', 'ankylo.png',
      'brachio.png', 'mem-raptor.png', 'mem-ammonite.png', 'mem-volcano.png',
    ],
  },
  space: {
    folder: 'Space', color: '#9fd1ff', bg: '#001830',
    files: [
      'head-rover.png', 'head-alien.png', 'head-shuttle.png', 'mem-astronaut.png',
      'mem-rocket.png', 'mem-ufo.png', 'mem-saturn.png', 'mem-moon.png',
      'mem-earth.png', 'mem-satellite.png', 'mem-station.png', 'mem-comet.png',
    ],
  },
  robots: {
    folder: 'Robots', color: '#8ae0ff', bg: '#0a1c2e',
    files: [
      'head-rusty.png', 'head-pixel.png', 'head-dot.png', 'mem-robodog.png',
      'mem-arm.png', 'mem-drone.png', 'mem-chip.png', 'mem-gear.png',
      'mem-battery.png', 'mem-windup.png', 'mem-magnet.png', 'mem-vacuum.png',
    ],
  },
  sea: {
    folder: 'Underwater', color: '#ffb39e', bg: '#2e0f06',
    files: [
      'head-stingray.png', 'head-marlin.png', 'head-anglerfish.png', 'mem-octopus.png',
      'mem-crab.png', 'mem-dolphin.png', 'mem-turtle.png', 'mem-seahorse.png',
      'mem-puffer.png', 'mem-shark.png', 'mem-clownfish.png', 'mem-submarine.png',
    ],
  },
}

// One picture entry: { id, world, color, bg, image }
export function worldPictures(worldId) {
  const w = WORLD_PICTURES[worldId]
  if (!w) return []
  return w.files.map(f => ({
    id: `${w.folder}-${f}`.replace(/[^a-zA-Z0-9]/g, ''),
    world: worldId,
    color: w.color,
    bg: w.bg,
    image: `/themes/${w.folder}/${f}`,
  }))
}

export const ALL_PICTURES = Object.keys(WORLD_PICTURES).flatMap(worldPictures)
