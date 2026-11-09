import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import RacerAvatar from '../../components/RacerAvatar'
import { playTap, playDiceRoll, playDiceClack, playDiceSettle, playClimb, playWin } from '../../sound/sfx'
import './Adventure.css'
import { CHALLENGES_BY_THEME, GENERAL_CHALLENGES } from './challengeQuestions'
import { makePictureQuestion } from './pictureQuestions'
import { speak, announce, speakSteps, stopSpeaking, canSpeak } from '../../sound/speech'

// ─── Board constants ───────────────────────────────────────────────────────────
const STEP_MS      = 170  // ms per tile during piece movement
const TRACK_LENGTH = 80
// Shortcuts: land on key → instantly jump to value
const SHORTCUTS    = { 14: 20, 26: 31, 44: 52 }

// ─── Square type helpers ───────────────────────────────────────────────────────
// ÷15  → big bonus (beats both below)
// ÷3 only → question
// ÷5 only → surprise card
const isBonus    = (s) => s > 0 && s < TRACK_LENGTH && s % 15 === 0
const isQuestion = (s) => s > 0 && s < TRACK_LENGTH && s % 3  === 0 && s % 15 !== 0
const isSurprise = (s) => s > 0 && s < TRACK_LENGTH && s % 5  === 0 && s % 15 !== 0

// ─── Surprise card pool (generic fallback) ─────────────────────────────────────
const SURPRISE_CARDS = [
  { emoji: '🚀', text: 'Zoom Zoom!',       desc: 'Fly forward 3 steps!',   delta:  3 },
  { emoji: '⛈️', text: 'Uh-oh! Storm!',    desc: 'Stumble back 2 steps!',  delta: -2 },
  { emoji: '🎉', text: 'Lucky Day!',        desc: 'Leap forward 2 steps!',  delta:  2 },
  { emoji: '🌈', text: 'Rainbow Hop!',      desc: 'Jump forward 1 step!',   delta:  1 },
  { emoji: '🐌', text: 'Slooow…',           desc: 'Slip back 1 step!',      delta: -1 },
  { emoji: '⭐', text: 'Shining Star!',     desc: 'Dash forward 3 steps!',  delta:  3 },
  { emoji: '💤', text: 'Yawn… so sleepy!',  desc: 'Snooze! Lose your next turn.', delta: 0, skip: true },
  { emoji: '🦋', text: 'Flutter Away!',     desc: 'Float forward 2 steps!', delta:  2 },
]

// ─── Big bonus card pool (generic fallback) ────────────────────────────────────
const BIG_BONUS_CARDS = [
  { emoji: '🏆', text: 'Grand Prize!',  desc: 'Sprint forward 6 steps!',  delta: 6 },
  { emoji: '🌟', text: 'Superstar!',    desc: 'Blast forward 5 steps!',   delta: 5 },
  { emoji: '🎁', text: 'Magic Gift!',   desc: 'Zoom forward 6 steps!',    delta: 6 },
  { emoji: '🎊', text: 'Jackpot!',      desc: 'Rocket forward 5 steps!',  delta: 5 },
]

// ─── Per-theme surprise card pools ─────────────────────────────────────────────
const THEME_SURPRISE_CARDS = {
  animals: [
    { emoji: '🐇', text: 'Bunny Hop!',       desc: 'Hop forward 2 steps!',          delta:  2 },
    { emoji: '🦅', text: 'Eagle Swoop!',     desc: 'Soar forward 3 steps!',         delta:  3 },
    { emoji: '🐢', text: 'Slow Turtle…',     desc: 'Shuffle back 1 step!',          delta: -1 },
    { emoji: '🦁', text: "Lion's Roar!",     desc: 'Charge forward 2 steps!',       delta:  2 },
    { emoji: '🐍', text: 'Snake Slither!',   desc: 'Slide back 2 steps!',           delta: -2 },
    { emoji: '🦋', text: 'Butterfly Breeze!',desc: 'Flutter forward 1 step!',       delta:  1 },
    { emoji: '🐘', text: 'Elephant Stomp!',  desc: 'Stomp forward 3 steps!',        delta:  3 },
    { emoji: '🦔', text: 'Hedgehog Curl-Up!',desc: 'Snooze! Lose your next turn.',  delta:  0, skip: true },
    { emoji: '🐒', text: 'Monkey Business!', desc: 'Swing forward 2 steps!',        delta:  2 },
    { emoji: '🦊', text: 'Sneaky Fox!',      desc: 'Sneak back 1 step!',            delta: -1 },
    { emoji: '🐆', text: 'Cheetah Dash!',    desc: 'Sprint forward 3 steps!',       delta:  3 },
    { emoji: '🦘', text: 'Kangaroo Bound!',  desc: 'Bound forward 2 steps!',        delta:  2 },
    { emoji: '🐝', text: 'Busy Bee!',        desc: 'Buzz forward 1 step!',          delta:  1 },
    { emoji: '🐻', text: 'Bear Hug Break!',  desc: 'Rest back 1 step!',             delta: -1 },
    { emoji: '🦜', text: 'Parrot Flap!',     desc: 'Flap forward 2 steps!',         delta:  2 },
    { emoji: '🐌', text: 'Snail Pace…',      desc: 'Crawl back 2 steps!',           delta: -2 },
  ],
  dinosaurs: [
    { emoji: '🦖', text: 'T-Rex Charge!',    desc: 'Stomp forward 3 steps!',        delta:  3 },
    { emoji: '🌋', text: 'Volcano Eruption!',desc: 'Tumble back 2 steps!',          delta: -2 },
    { emoji: '🥚', text: 'Egg Hunt!',        desc: 'Hatch forward 2 steps!',        delta:  2 },
    { emoji: '🦕', text: 'Long Neck Reach!', desc: 'Stretch forward 1 step!',       delta:  1 },
    { emoji: '🦴', text: 'Stuck in the Mud!',desc: 'Sink back 1 step!',             delta: -1 },
    { emoji: '☄️', text: 'Meteor Shower!',   desc: 'Duck back 2 steps!',            delta: -2 },
    { emoji: '🦅', text: 'Pterodactyl Swoop!',desc: 'Glide forward 3 steps!',       delta:  3 },
    { emoji: '😴', text: 'Dino Nap!',        desc: 'Snooze! Lose your next turn.',  delta:  0, skip: true },
    { emoji: '🌿', text: 'Tasty Leaves!',    desc: 'Munch forward 2 steps!',        delta:  2 },
    { emoji: '🐊', text: 'Swamp Slip!',      desc: 'Slip back 1 step!',             delta: -1 },
    { emoji: '👣', text: 'Fresh Tracks!',    desc: 'Follow forward 2 steps!',       delta:  2 },
    { emoji: '🦷', text: 'Sharp Teeth Snap!',desc: 'Chomp forward 3 steps!',        delta:  3 },
    { emoji: '🌴', text: 'Jungle Detour!',   desc: 'Wander back 2 steps!',          delta: -2 },
    { emoji: '🛡️', text: 'Armoured Charge!', desc: 'Barge forward 1 step!',         delta:  1 },
    { emoji: '🦎', text: 'Tail Whip!',       desc: 'Whip forward 2 steps!',         delta:  2 },
    { emoji: '🕳️', text: 'Tar Pit!',         desc: 'Sink back 1 step!',             delta: -1 },
  ],
  space: [
    { emoji: '🚀', text: 'Rocket Boost!',    desc: 'Blast forward 3 steps!',        delta:  3 },
    { emoji: '☄️', text: 'Asteroid Field!',  desc: 'Dodge back 2 steps!',           delta: -2 },
    { emoji: '🛸', text: 'UFO Lift!',        desc: 'Float forward 2 steps!',        delta:  2 },
    { emoji: '👽', text: 'Alien Wave!',      desc: 'Beam forward 1 step!',          delta:  1 },
    { emoji: '🌑', text: 'Gravity Pull!',    desc: 'Drift back 1 step!',            delta: -1 },
    { emoji: '⭐', text: 'Shooting Star!',   desc: 'Streak forward 3 steps!',       delta:  3 },
    { emoji: '🪐', text: 'Ring Slingshot!',  desc: 'Spin forward 2 steps!',         delta:  2 },
    { emoji: '😴', text: 'Zero-G Nap!',      desc: 'Snooze! Lose your next turn.',  delta:  0, skip: true },
    { emoji: '🌠', text: 'Comet Tail!',      desc: 'Glide forward 1 step!',         delta:  1 },
    { emoji: '🧲', text: 'Magnetic Drag!',   desc: 'Pull back 2 steps!',            delta: -2 },
    { emoji: '🌟', text: 'Star Power!',      desc: 'Shine forward 2 steps!',        delta:  2 },
    { emoji: '🔭', text: 'New Discovery!',   desc: 'Leap forward 3 steps!',         delta:  3 },
    { emoji: '🌍', text: 'Earth Pull!',      desc: 'Drift back 1 step!',            delta: -1 },
    { emoji: '🌖', text: 'Moon Bounce!',     desc: 'Hop forward 1 step!',           delta:  1 },
    { emoji: '🛰️', text: 'Satellite Ping!',  desc: 'Beam forward 2 steps!',         delta:  2 },
    { emoji: '🌫️', text: 'Cosmic Dust!',     desc: 'Drift back 2 steps!',           delta: -2 },
  ],
  robots: [
    { emoji: '⚙️', text: 'Turbo Gears!',     desc: 'Whirr forward 3 steps!',        delta:  3 },
    { emoji: '🔌', text: 'Power Outage!',    desc: 'Power down 2 steps!',           delta: -2 },
    { emoji: '🤖', text: 'System Upgrade!',  desc: 'Boost forward 2 steps!',        delta:  2 },
    { emoji: '📡', text: 'Signal Boost!',    desc: 'Ping forward 1 step!',          delta:  1 },
    { emoji: '🔧', text: 'Rusty Joint!',     desc: 'Creak back 1 step!',            delta: -1 },
    { emoji: '⚡', text: 'Static Shock!',    desc: 'Zap forward 3 steps!',          delta:  3 },
    { emoji: '🔋', text: 'Battery Boost!',   desc: 'Recharge forward 2 steps!',     delta:  2 },
    { emoji: '😴', text: 'Sleep Mode!',      desc: 'Snooze! Lose your next turn.',  delta:  0, skip: true },
    { emoji: '🧲', text: 'Magnet Grab!',     desc: 'Pull forward 1 step!',          delta:  1 },
    { emoji: '🛑', text: 'Short Circuit!',   desc: 'Reboot back 2 steps!',          delta: -2 },
    { emoji: '🚀', text: 'Rocket Mode!',     desc: 'Blast forward 3 steps!',        delta:  3 },
    { emoji: '💡', text: 'Bright Idea!',     desc: 'Spark forward 2 steps!',        delta:  2 },
    { emoji: '🛞', text: 'Wheels Whirring!', desc: 'Roll forward 1 step!',          delta:  1 },
    { emoji: '🔩', text: 'Loose Bolt!',      desc: 'Wobble back 1 step!',           delta: -1 },
    { emoji: '🖥️', text: 'Glitchy Screen!',  desc: 'Freeze back 2 steps!',          delta: -2 },
    { emoji: '🎮', text: 'Remote Boost!',    desc: 'Zip forward 2 steps!',          delta:  2 },
  ],
  sea: [
    { emoji: '🐬', text: 'Dolphin Splash!',  desc: 'Leap forward 3 steps!',         delta:  3 },
    { emoji: '🌊', text: 'Big Wave!',        desc: 'Tumble back 2 steps!',          delta: -2 },
    { emoji: '🐢', text: 'Turtle Glide!',    desc: 'Paddle forward 1 step!',        delta:  1 },
    { emoji: '🦑', text: 'Ink Cloud!',       desc: 'Drift back 1 step!',            delta: -1 },
    { emoji: '🐡', text: 'Pufferfish Surprise!',desc: 'Puff forward 2 steps!',      delta:  2 },
    { emoji: '⚡', text: 'Electric Eel!',    desc: 'Zap forward 3 steps!',          delta:  3 },
    { emoji: '🦀', text: 'Crab Scuttle!',    desc: 'Scuttle forward 2 steps!',      delta:  2 },
    { emoji: '😴', text: 'Sleepy Seahorse!', desc: 'Snooze! Lose your next turn.',  delta:  0, skip: true },
    { emoji: '🫧', text: 'Bubble Stream!',   desc: 'Float forward 1 step!',         delta:  1 },
    { emoji: '🐙', text: 'Tangled in Kelp!', desc: 'Struggle back 2 steps!',        delta: -2 },
    { emoji: '🦈', text: 'Shark Sprint!',    desc: 'Dart forward 3 steps!',         delta:  3 },
    { emoji: '🐠', text: 'School of Fish!',  desc: 'Swim forward 2 steps!',         delta:  2 },
    { emoji: '🐚', text: 'Shiny Shell!',     desc: 'Drift forward 1 step!',         delta:  1 },
    { emoji: '🌊', text: 'Riptide!',         desc: 'Wash back 1 step!',             delta: -1 },
    { emoji: '⚓', text: 'Heavy Anchor!',    desc: 'Sink back 2 steps!',            delta: -2 },
    { emoji: '🐢', text: 'Turtle Boost!',    desc: 'Paddle forward 2 steps!',       delta:  2 },
  ],
}

// ─── Per-theme big bonus card pools ────────────────────────────────────────────
const THEME_BONUS_CARDS = {
  animals: [
    { emoji: '🦁', text: 'King of the Jungle!', desc: 'Charge forward 6 steps!', delta: 6 },
    { emoji: '🦅', text: 'Eagle Express!',      desc: 'Soar forward 5 steps!',   delta: 5 },
    { emoji: '🐘', text: 'Mighty Herd!',        desc: 'Stomp forward 6 steps!',  delta: 6 },
    { emoji: '🐅', text: 'Tiger Sprint!',       desc: 'Dash forward 5 steps!',   delta: 5 },
    { emoji: '🦓', text: 'Zebra Stripes Dash!', desc: 'Gallop forward 5 steps!', delta: 5 },
    { emoji: '🐆', text: 'Cheetah Burst!',      desc: 'Race forward 6 steps!',   delta: 6 },
    { emoji: '🦘', text: 'Mega Kangaroo Leap!', desc: 'Bound forward 5 steps!',  delta: 5 },
  ],
  dinosaurs: [
    { emoji: '🦖', text: 'T-Rex Sprint!',     desc: 'Stomp forward 6 steps!',  delta: 6 },
    { emoji: '🥚', text: 'Nest Full of Eggs!',desc: 'Hatch forward 5 steps!',  delta: 5 },
    { emoji: '🦴', text: 'Fossil Find!',      desc: 'Dig forward 6 steps!',    delta: 6 },
    { emoji: '🌋', text: 'Lucky Escape!',     desc: 'Dash forward 5 steps!',   delta: 5 },
    { emoji: '🦕', text: 'Giant Stride!',     desc: 'Stride forward 5 steps!', delta: 5 },
    { emoji: '🦅', text: 'Pterodactyl Dive!', desc: 'Swoop forward 6 steps!',  delta: 6 },
    { emoji: '🌿', text: 'Lush Valley!',      desc: 'Graze forward 5 steps!',  delta: 5 },
  ],
  space: [
    { emoji: '🚀', text: 'Hyperspace Jump!', desc: 'Warp forward 6 steps!',   delta: 6 },
    { emoji: '🌟', text: 'Supernova!',       desc: 'Blast forward 5 steps!',  delta: 5 },
    { emoji: '🛰️', text: 'Satellite Boost!', desc: 'Orbit forward 6 steps!',  delta: 6 },
    { emoji: '🪐', text: 'Warp Speed!',      desc: 'Zoom forward 5 steps!',   delta: 5 },
    { emoji: '👨‍🚀', text: 'Astronaut Salute!',desc: 'Float forward 5 steps!', delta: 5 },
    { emoji: '☄️', text: 'Comet Ride!',      desc: 'Streak forward 6 steps!', delta: 6 },
    { emoji: '🌌', text: 'Galaxy Leap!',     desc: 'Soar forward 5 steps!',   delta: 5 },
  ],
  robots: [
    { emoji: '🚀', text: 'Rocket Thrusters!', desc: 'Launch forward 6 steps!', delta: 6 },
    { emoji: '🦾', text: 'Power Surge!',      desc: 'Surge forward 5 steps!',  delta: 5 },
    { emoji: '⚙️', text: 'Overdrive!',        desc: 'Whirr forward 6 steps!',  delta: 6 },
    { emoji: '🤖', text: 'Mainframe Boost!',  desc: 'Boost forward 5 steps!',  delta: 5 },
    { emoji: '⚡', text: 'Maximum Power!',    desc: 'Zap forward 5 steps!',    delta: 5 },
    { emoji: '💡', text: 'Genius Spark!',     desc: 'Leap forward 6 steps!',   delta: 6 },
    { emoji: '🛰️', text: 'Turbo Thrusters!',  desc: 'Launch forward 5 steps!', delta: 5 },
  ],
  sea: [
    { emoji: '🐬', text: 'Dolphin Leap!',      desc: 'Leap forward 6 steps!',  delta: 6 },
    { emoji: '🐋', text: 'Whale Wave!',        desc: 'Surf forward 5 steps!',  delta: 5 },
    { emoji: '🦈', text: 'Shark Sprint!',      desc: 'Dash forward 6 steps!',  delta: 6 },
    { emoji: '🚢', text: 'Treasure Find!',     desc: 'Sail forward 5 steps!',  delta: 5 },
    { emoji: '🌊', text: 'Riding the Current!',desc: 'Glide forward 5 steps!', delta: 5 },
    { emoji: '🐋', text: 'Whale Surge!',       desc: 'Surge forward 6 steps!', delta: 6 },
    { emoji: '🐢', text: 'Turtle Express!',    desc: 'Paddle forward 5 steps!',delta: 5 },
  ],
}

// ─── Shuffle-bag helper: draws without replacement, reshuffles when empty,
//     and avoids the same item repeating across a reshuffle boundary ────────────
function shuffleArr(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function createShuffleBag(items) {
  let queue = []
  let lastItem = null
  const refill = () => {
    queue = shuffleArr(items)
    if (queue.length > 1 && queue[queue.length - 1] === lastItem) {
      const swapIdx = Math.floor(Math.random() * (queue.length - 1));
      [queue[swapIdx], queue[queue.length - 1]] = [queue[queue.length - 1], queue[swapIdx]]
    }
  }
  refill()
  return {
    next() {
      if (queue.length === 0) refill()
      const item = queue.pop()
      lastItem = item
      return item
    },
  }
}

function pickSurprise(bag) {
  return { type: 'surprise', ...bag.next() }
}
function pickBonus(bag) {
  return { type: 'bonus', ...bag.next() }
}

// Overshoot → bounce back from 80
function applyBounce(pos, roll) {
  const n = pos + roll
  if (n > TRACK_LENGTH) return TRACK_LENGTH - (n - TRACK_LENGTH)
  return Math.max(0, n)
}

// ─── Catmull-Rom spline path ───────────────────────────────────────────────────
const CONTROL = [
  [11.9, 11.0], [4.2, 14.5], [5.9, 23.4], [16.1, 18.9], [28.4, 26.1],
  [39.2, 35.5], [56.5, 26.8], [67.9, 16.1], [84.9, 18.2], [93.5, 27.7],
  [94.6, 48.6], [86.8, 65.4], [66.5, 62.8], [50.9, 53.5], [35.8, 52.9],
  [25.4, 59.0], [8.5, 61.1], [10.8, 85.8], [35.5, 89.1], [50.5, 87.9],
  [59.7, 81.3], [79.0, 80.0],
]

// Animals theme — route traced on boards/board-animals-new.png:
// starts bottom-left, passes the fox, loops around the pond, past the rocks
// and the rabbit, up beside the bear and the mushrooms, crosses the river,
// winds past the boulders, the owl's tree and the hollow stump, and finishes
// at the foot of the waterfall.
const CONTROL_ANIMALS = [
  [4, 96], [14, 92], [24, 89], [30, 80], [28, 70], [38, 64], [52, 65],
  [58, 74], [57, 88], [65, 93], [73, 87], [74, 77], [86, 68], [94, 63],
  [85, 56], [74, 53], [62, 57], [52, 54], [44, 47], [36, 41], [24, 40],
  [12, 47], [4, 40], [6, 30], [19, 27], [28, 20], [35, 30], [48, 32],
  [57, 25], [62, 15], [70, 19],
]

// Dino theme gets its own hand-traced path matching the dino board art.
const CONTROL_DINO = [
  [7.9, 17.7],
  [10.5, 29.1],
  [6.1, 40.1],
  [15.5, 44.4],
  [36.1, 33.0],
  [45.2, 41.8],
  [58.9, 41.6],
  [68.0, 21.9],
  [82.1, 33.1],
  [90.6, 51.4],
  [83.9, 61.1],
  [69.3, 51.0],
  [48.3, 60.5],
  [33.9, 50.3],
  [21.6, 61.3],
  [6.8, 66.3],
  [2.3, 87.2],
  [27.1, 96.9],
  [37.3, 82.8],
  [44.3, 83.9],
  [58.6, 96.3],
  [81.1, 91.4],
]

// Robots theme path matching the robots board art.
const CONTROL_ROBOTS = [
  [1.0, 41.8],
  [2.9, 48.6],
  [15.2, 51.1],
  [22.3, 52.6],
  [32.3, 53.0],
  [43.0, 46.3],
  [45.8, 32.8],
  [68.2, 30.6],
  [81.6, 28.4],
  [89.0, 36.1],
  [91.4, 45.6],
  [83.2, 57.8],
  [71.9, 54.1],
  [54.6, 54.1],
  [42.0, 56.0],
  [27.5, 62.5],
  [1.1, 57.5],
  [3.0, 86.1],
  [22.0, 88.6],
  [31.7, 95.9],
  [53.5, 95.7],
  [91.0, 93.2],
]

// Sea/underwater theme path.
const CONTROL_SEA = [
  [23.9, 59.8],
  [36.3, 50.0],
  [31.9, 25.0],
  [14.9, 22.8],
  [4.2, 34.5],
  [2.0, 42.4],
  [1.8, 50.3],
  [1.5, 68.0],
  [1.4, 76.0],
  [3.6, 92.5],
  [21.8, 96.4],
  [36.3, 71.5],
  [56.4, 71.6],
  [60.0, 94.9],
  [78.4, 95.0],
  [86.7, 74.6],
  [68.8, 63.9],
  [68.5, 46.2],
  [85.0, 40.3],
  [79.1, 25.2],
  [64.5, 30.0],
  [48.6, 20.8],
]

// Space theme — two disconnected segments (black hole split)
const SPACE_HOLE_TILE = 34
const PATH_CONTROL_1 = [
  [4.3, 16.8],
  [4.1, 26.5],
  [9.9, 34.9],
  [30.4, 38.4],
  [27.3, 11.9],
  [39.3, 5.0],
  [49.0, 20.6],
  [59.5, 24.8],
  [76.6, 15.3],
  [82.1, 32.4],
  [95.4, 31.8],
  [93.6, 48.9],
]
const PATH_CONTROL_2 = [
  [76.6, 50.7],
  [50.9, 53.5],
  [37.5, 55.0],
  [36.3, 64.4],
  [41.3, 72.4],
  [50.7, 66.7],
  [64.1, 71.9],
  [84.0, 65.7],
  [81.4, 93.9],
  [12.6, 96.0],
]

const CONTROL_BY_THEME = {
  animals: CONTROL_ANIMALS,
  dinosaurs: CONTROL_DINO,
  robots: CONTROL_ROBOTS,
  sea: CONTROL_SEA,
  space: 'split', // handled separately via PATH_CONTROL_1 / PATH_CONTROL_2
}

const ASPECT = 1.5

function buildPath(control) {
  const p = control
  const at = (i) => p[Math.max(0, Math.min(p.length - 1, i))]
  const dense = []
  const SUB = 60
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2)
    for (let t = 0; t < SUB; t++) {
      const u = t / SUB, u2 = u * u, u3 = u2 * u
      const cr = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3)
      dense.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])])
    }
  }
  dense.push([p[p.length - 1][0], p[p.length - 1][1]])

  const cum = [0]
  for (let i = 1; i < dense.length; i++) {
    const dx = (dense[i][0] - dense[i - 1][0]) * ASPECT, dy = dense[i][1] - dense[i - 1][1]
    cum.push(cum[i - 1] + Math.hypot(dx, dy))
  }
  const total = cum[cum.length - 1] || 1
  const out = []
  let j = 0
  for (let k = 0; k <= TRACK_LENGTH; k++) {
    const target = total * k / TRACK_LENGTH
    while (j < dense.length - 2 && cum[j + 1] < target) j++
    const seg = (cum[j + 1] - cum[j]) || 1, f = (target - cum[j]) / seg
    out.push({ x: dense[j][0] + (dense[j + 1][0] - dense[j][0]) * f, y: dense[j][1] + (dense[j + 1][1] - dense[j][1]) * f })
  }
  return out
}

const PATH  = buildPath(CONTROL)
const ROAD_D = 'M ' + PATH.map(p => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ')
const ANG   = PATH.map((_, i) => {
  const a = PATH[Math.max(0, i - 1)], b = PATH[Math.min(TRACK_LENGTH, i + 1)]
  return Math.atan2((b.y - a.y) / ASPECT, (b.x - a.x)) * 180 / Math.PI
})

function buildRoad(path) {
  return 'M ' + path.map(p => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ')
}
function buildAng(path) {
  return path.map((_, i) => {
    const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)]
    return Math.atan2((b.y - a.y) / ASPECT, (b.x - a.x)) * 180 / Math.PI
  })
}

// Like buildPath but resamples to exactly N tiles (returns N+1 points: 0..N)
function buildPathN(control, N) {
  const p = control
  const at = (i) => p[Math.max(0, Math.min(p.length - 1, i))]
  const dense = []
  const SUB = 60
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2)
    for (let t = 0; t < SUB; t++) {
      const u = t / SUB, u2 = u * u, u3 = u2 * u
      const cr = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3)
      dense.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])])
    }
  }
  dense.push([p[p.length - 1][0], p[p.length - 1][1]])
  const cum = [0]
  for (let i = 1; i < dense.length; i++) {
    const dx = (dense[i][0] - dense[i - 1][0]) * ASPECT, dy = dense[i][1] - dense[i - 1][1]
    cum.push(cum[i - 1] + Math.hypot(dx, dy))
  }
  const total = cum[cum.length - 1] || 1
  const out = []
  let j = 0
  for (let k = 0; k <= N; k++) {
    const target = total * k / N
    while (j < dense.length - 2 && cum[j + 1] < target) j++
    const seg = (cum[j + 1] - cum[j]) || 1, f = (target - cum[j]) / seg
    out.push({ x: dense[j][0] + (dense[j + 1][0] - dense[j][0]) * f, y: dense[j][1] + (dense[j + 1][1] - dense[j][1]) * f })
  }
  return out
}

function getPathForTheme(themeId) {
  if (themeId === 'space') {
    // Each segment is resampled independently to exactly cover its tile range
    const seg1 = buildPathN(PATH_CONTROL_1, SPACE_HOLE_TILE)                    // tiles 0..HOLE  (HOLE+1 pts)
    const seg2 = buildPathN(PATH_CONTROL_2, TRACK_LENGTH - SPACE_HOLE_TILE - 1) // tiles HOLE+1..80 (exact pts)
    const path = [...seg1, ...seg2]                                               // 81 pts total (0..80)
    const road1 = buildRoad(seg1)
    const road2 = buildRoad(seg2)
    const ang = buildAng(path)
    return { path, road: road1, road2, ang }
  }
  const control = CONTROL_BY_THEME[themeId]
  if (!control || control === 'split') return { path: PATH, road: ROAD_D, road2: null, ang: ANG }
  const path = buildPath(control)
  return { path, road: buildRoad(path), road2: null, ang: buildAng(path) }
}

const T_OFF = [
  { dx:  0, dy:  0 },
  { dx: 14, dy:  0 },
  { dx:  0, dy: -14 },
  { dx: 14, dy: -14 },
]

// ─── Themed question pool helper ───────────────────────────────────────────────
// One difficulty for everyone — every theme has its own pool of trivia that
// matches the board. Falls back to the general pool if a theme has no list.
function getQuestionPool(themeId) {
  const pool = CHALLENGES_BY_THEME[themeId]
  return (pool && pool.length) ? pool : GENERAL_CHALLENGES
}

const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)]

// ─── Challenge picker ─────────────────────────────────────────────────────────
function pickChallenge(bag) {
  const src     = bag.next()
  const idxArr  = [0, 1, 2, 3]
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idxArr[i], idxArr[j]] = [idxArr[j], idxArr[i]]
  }
  const correctIdx = idxArr.indexOf(0)
  return {
    type:       'question',
    question:   src.q,
    options:    idxArr.map(i => src.options[i]),
    correctIdx,
    stars:      2,
    answered:   null,
  }
}

// ─── Dice face SVG ────────────────────────────────────────────────────────────
const DICE_DOTS = {
  1: [[50, 50]],
  2: [[32, 32], [68, 68]],
  3: [[32, 32], [50, 50], [68, 68]],
  4: [[32, 32], [68, 32], [32, 68], [68, 68]],
  5: [[32, 32], [68, 32], [50, 50], [32, 68], [68, 68]],
  6: [[32, 28], [68, 28], [32, 50], [68, 50], [32, 72], [68, 72]],
}

function DiceFace({ value, rolling }) {
  if (!value) return (
    <div className="dice-empty">🎲</div>
  )
  const dots = DICE_DOTS[value] || []
  return (
    <svg className={`dice-face${rolling ? ' dice-rolling' : ''}`}
         viewBox="0 0 100 100" width="80" height="80"
         xmlns="http://www.w3.org/2000/svg">
      {/* shadow */}
      <rect x="9" y="11" width="88" height="88" rx="16" fill="rgba(0,0,0,0.28)" />
      {/* face */}
      <rect x="5" y="5" width="90" height="90" rx="16"
            fill="#f7efda" stroke="#c8a040" strokeWidth="3" />
      {/* top highlight */}
      <rect x="9" y="9" width="82" height="36" rx="12"
            fill="rgba(255,255,255,0.30)" />
      {/* dots */}
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="9" fill="#2a1800" />
      ))}
    </svg>
  )
}

// ─── Picture answer (for the no-reading mode) ────────────────────────────────
function PictureOption({ opt }) {
  if (opt.dots) {
    const dots = DICE_DOTS[opt.dots] || []
    return (
      <svg className="pic-dice" viewBox="0 0 100 100" aria-label={opt.label}>
        <rect x="5" y="5" width="90" height="90" rx="16" fill="#fffdf7" stroke="#c8a040" strokeWidth="4" />
        {dots.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="10" fill="#2a1800" />)}
      </svg>
    )
  }
  if (opt.color) return <span className="pic-color" style={{ background: opt.color }} aria-label={opt.label} />
  if (opt.count) return <span className="pic-group" aria-label={opt.label}>{opt.emoji.repeat(opt.count)}</span>
  return <span className="pic-emoji" aria-label={opt.label}>{opt.emoji}</span>
}

const LETTERS = ['A', 'B', 'C', 'D']

// ─── Animations ───────────────────────────────────────────────────────────────
const gameoverVariants = {
  initial: { opacity: 0, scale: 0.85, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdventureGame({ onBack }) {
  const { theme } = useTheme()
  const { path: PATH, road: ROAD_D, road2: ROAD_D2, ang: ANG } = useMemo(() => getPathForTheme(theme.id), [theme.id])

  const [phase,         setPhase]         = useState('setup')
  const [playerCount,   setPlayerCount]   = useState(2)
  const [positions,     setPositions]     = useState([])
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [log,           setLog]           = useState([])
  const [winner,        setWinner]        = useState(null)
  const [animating,     setAnimating]     = useState(false)
  const [challenge,     setChallenge]     = useState(null)
  const [diceValue,     setDiceValue]     = useState(null)
  const [rolling,       setRolling]       = useState(false)
  // displayPos tracks the visual (animated) position; positions tracks the game-logic position
  const [displayPos,    setDisplayPos]    = useState([])
  // sleepers[i] === true → player i must skip their next turn (display mirror of skipRef)
  const [sleepers,      setSleepers]      = useState([])
  // 'read' = text trivia · 'picture' = tap-the-picture questions + voice (no reading needed)
  const [mode,          setMode]          = useState(() => {
    try { return localStorage.getItem('adv-mode') || 'read' } catch { return 'read' }
  })
  const [voiceOn,       setVoiceOn]       = useState(true)
  const recentPicRef = useRef([])
  const pictureMode = mode === 'picture'
  // game announcements queue up so none gets cut off by the next one
  const talk = useCallback((text) => { if (pictureMode && voiceOn) announce(text) }, [pictureMode, voiceOn])
  // Which part is being read aloud right now: -1 = the question, 0–3 = an answer.
  const [readingIdx, setReadingIdx] = useState(null)
  // queue = true for automatic reading (waits for "your turn!" etc. to finish);
  // the 🔊 button reads straight away.
  const readChallenge = useCallback((c, queue = false) => {
    if (!c) return
    if (c.picture) { speakSteps([{ text: c.say }], null, { queue }); return }
    speakSteps([
      { text: c.question, onStart: () => setReadingIdx(-1) },
      ...c.options.map((o, i) => ({ text: `${LETTERS[i]}: ${o}.`, onStart: () => setReadingIdx(i) })),
    ], () => setReadingIdx(null), { queue })
  }, [])

  const rollTimer  = useRef(null)
  const moveTimer  = useRef(null)
  // Source of truth for skip-a-turn flags (ref so logic is synchronous & StrictMode-safe)
  const skipRef    = useRef([])
  // No-repeat shuffle bags for questions/surprise/bonus cards, (re)built on startGame
  const questionBagRef = useRef(null)
  const surpriseBagRef = useRef(null)
  const bonusBagRef     = useRef(null)

  // Rebuild card + question bags whenever theme changes (mid-game theme switch)
  useEffect(() => {
    questionBagRef.current = createShuffleBag(getQuestionPool(theme.id))
    surpriseBagRef.current = createShuffleBag(THEME_SURPRISE_CARDS[theme.id] ?? SURPRISE_CARDS)
    bonusBagRef.current    = createShuffleBag(THEME_BONUS_CARDS[theme.id]    ?? BIG_BONUS_CARDS)
  }, [theme.id])

  // Clean up timers (and any speech) on unmount
  useEffect(() => () => {
    stopSpeaking()
    if (rollTimer.current) clearTimeout(rollTimer.current)
    if (moveTimer.current) clearTimeout(moveTimer.current)
  }, [])

  // Animate a token one step at a time from 'from' → 'to', calling onDone when complete.
  // msPerStep controls speed; direction is inferred automatically (handles bounce-back).
  const animateSteps = useCallback((playerIdx, from, to, msPerStep, onDone) => {
    if (from === to) { onDone(); return }
    const dir = to > from ? 1 : -1
    let cur = from
    const advance = () => {
      cur += dir
      setDisplayPos(prev => prev.map((p, i) => i === playerIdx ? cur : p))
      playTap()
      if (cur !== to) {
        moveTimer.current = setTimeout(advance, msPerStep)
      } else {
        onDone()
      }
    }
    moveTimer.current = setTimeout(advance, msPerStep)
  }, [])

  // Play the win jingle whenever the game reaches the game-over screen.
  useEffect(() => {
    if (phase === 'gameover') playWin()
  }, [phase])

  const addLog = (msg) => setLog(prev => [msg, ...prev].slice(0, 6))

  const racers = theme.raceRacers.slice(0, playerCount)

  // Pass the turn from player `cp` to the next player, honouring sleep (skip) flags.
  // If `sleepSelf` is true, `cp` is flagged to miss their *next* turn (used by the 💤 card).
  const passTurn = useCallback((cp, sleepSelf = false) => {
    const flags = [...skipRef.current]
    if (sleepSelf) flags[cp] = true
    let next = (cp + 1) % playerCount
    let guard = 0
    while (flags[next] && guard++ < playerCount) {
      flags[next] = false
      addLog(`💤 ${racers[next]?.emoji} ${racers[next]?.name} is fast asleep — turn skipped!`)
      next = (next + 1) % playerCount
    }
    skipRef.current = flags
    setSleepers(flags)
    setCurrentPlayer(next)
  }, [playerCount, racers])

  // ── Start / restart ─────────────────────────────────────────────────────────
  const startGame = useCallback((count) => {
    if (rollTimer.current) clearTimeout(rollTimer.current)
    setPlayerCount(count)
    setPositions(Array(count).fill(0))
    setDisplayPos(Array(count).fill(0))
    skipRef.current = Array(count).fill(false)
    setSleepers(Array(count).fill(false))
    setCurrentPlayer(0)
    setDiceValue(null)
    setRolling(false)
    setLog(['🗺️ Adventure begins! Roll the dice!'])
    setWinner(null)
    setAnimating(false)
    setChallenge(null)
    setPhase('playing')

    // Build fresh no-repeat shuffle bags for this game session
    questionBagRef.current = createShuffleBag(getQuestionPool(theme.id))
    surpriseBagRef.current = createShuffleBag(THEME_SURPRISE_CARDS[theme.id] ?? SURPRISE_CARDS)
    bonusBagRef.current    = createShuffleBag(THEME_BONUS_CARDS[theme.id] ?? BIG_BONUS_CARDS)
  }, [theme])

  // ── Dice roll ────────────────────────────────────────────────────────────────
  const rollDice = useCallback(() => {
    if (animating || rolling || phase !== 'playing' || challenge) return

    setRolling(true)
    setAnimating(true)
    playDiceRoll()  // plays a recording if present; otherwise the per-flip clacks below

    let count = 0
    const rnd = () => Math.ceil(Math.random() * 6)

    const tick = () => {
      setDiceValue(rnd())
      count++
      if (count < 6) {
        playDiceClack()                        // one clack per visible face flip
        // uneven, decelerating gaps so the tumble doesn't feel metronomic
        rollTimer.current = setTimeout(tick, 90 + count * 18 + Math.random() * 45)
      } else {
        const finalRoll = rnd()
        setDiceValue(finalRoll)
        playDiceSettle()                        // heavier hit as it lands
        setRolling(false)

        // Begin step-by-step movement 350 ms after dice settles
        rollTimer.current = setTimeout(() => {
          const cp     = currentPlayer
          const curPos = positions[cp]
          const racer  = racers[cp]
          const rawPos = curPos + finalRoll
          const isBounce = rawPos > TRACK_LENGTH
          // position after bounce (if any)
          const landPos = isBounce ? TRACK_LENGTH - (rawPos - TRACK_LENGTH) : rawPos
          // shortcut destination (if any)
          const shortDest = Object.prototype.hasOwnProperty.call(SHORTCUTS, landPos)
            ? SHORTCUTS[landPos] : null
          const finalPos = shortDest ?? landPos

          // Log the roll
          if (isBounce) {
            addLog(`🎲 ${racer.emoji} ${racer.name} rolls ${finalRoll} — bounces back!`)
          } else {
            addLog(`🎲 ${racer.emoji} ${racer.name} rolls ${finalRoll}`)
          }

          // Store final game-logic position immediately
          setPositions(prev => prev.map((p, i) => i === cp ? finalPos : p))

          // Called once the piece reaches its true final square
          const afterMove = () => {
            if (finalPos === TRACK_LENGTH) {
              setWinner(cp)
              setPhase('gameover')
              setAnimating(false)
              return
            }
            if (isBonus(finalPos)) {
              setChallenge(pickBonus(bonusBagRef.current))
              setAnimating(false)
              return
            }
            if (isSurprise(finalPos)) {
              setChallenge(pickSurprise(surpriseBagRef.current))
              setAnimating(false)
              return
            }
            if (isQuestion(finalPos)) {
              if (pictureMode) {
                const q = makePictureQuestion(theme.id, recentPicRef.current)
                recentPicRef.current = [...recentPicRef.current, q.sig].slice(-6)
                setChallenge(q)
              } else {
                setChallenge(pickChallenge(questionBagRef.current))
              }
              setAnimating(false)
              return
            }
            passTurn(cp)
            setAnimating(false)
          }

          // Called after reaching landPos — handle optional shortcut
          const afterLand = () => {
            if (shortDest != null) {
              playClimb()
              addLog(`🛤️ Shortcut! ${landPos} → ${shortDest}!`)
              animateSteps(cp, landPos, shortDest, STEP_MS * 0.55, afterMove)
            } else {
              afterMove()
            }
          }

          if (isBounce) {
            // Walk to 80 first, then reverse to landPos
            animateSteps(cp, curPos, TRACK_LENGTH, STEP_MS, () =>
              animateSteps(cp, TRACK_LENGTH, landPos, STEP_MS, afterLand)
            )
          } else {
            animateSteps(cp, curPos, landPos, STEP_MS, afterLand)
          }
        }, 300)
      }
    }

    rollTimer.current = setTimeout(tick, 80)
  }, [animating, rolling, phase, challenge, positions, currentPlayer, playerCount, racers, passTurn, pictureMode, theme.id])

  // ── Collect a surprise / bonus card ─────────────────────────────────────────
  const collectCard = useCallback(() => {
    if (!challenge || challenge.type === 'question') return
    const cp      = currentPlayer

    // 💤 Sleep card → no movement, but the player misses their next turn.
    if (challenge.skip) {
      addLog(`${challenge.emoji} ${challenge.text} ${racers[cp].emoji} ${racers[cp].name} will snooze!`)
      setChallenge(null)
      passTurn(cp, true)
      return
    }

    const fromPos = positions[cp]
    const toPos   = applyBounce(fromPos, challenge.delta)

    addLog(`${challenge.emoji} ${challenge.text} ${racers[cp].emoji} ${challenge.delta >= 0 ? '+' : ''}${challenge.delta} steps!`)
    setPositions(prev => prev.map((p, i) => i === cp ? toPos : p))
    setChallenge(null)

    if (challenge.delta !== 0) {
      animateSteps(cp, fromPos, toPos, STEP_MS * 0.8, () => {
        if (toPos === TRACK_LENGTH) { setWinner(cp); setPhase('gameover') }
        else                        passTurn(cp)
      })
    } else {
      passTurn(cp)
    }
  }, [challenge, positions, currentPlayer, racers, animateSteps, passTurn])

  // ── Challenge resolution ─────────────────────────────────────────────────────
  const resolveChallenge = useCallback((chosenIdx) => {
    if (!challenge || challenge.answered !== null) return
    setChallenge(prev => ({ ...prev, answered: chosenIdx }))
    setReadingIdx(null)
    if (!challenge.picture) stopSpeaking()
    if (chosenIdx === challenge.correctIdx) talk(pickOne(['Yes! Great job!', 'Well done!', 'That\'s right! Brilliant!', 'Super! You got it!']))
    else talk(challenge.picture ? `Oh, not quite. It was ${challenge.label}.` : 'Oh, not quite. Good try!')

    setTimeout(() => {
      const correct  = chosenIdx === challenge.correctIdx
      const delta    = correct ? 3 : -1
      const cp       = currentPlayer
      const fromPos  = positions[cp]
      const toPos    = applyBounce(fromPos, delta)

      addLog(correct
        ? `✨ Correct! ${racers[cp].emoji} +3 steps!`
        : `❌ Wrong! ${racers[cp].emoji} -1 step!`)

      setPositions(prev => prev.map((p, i) => i === cp ? toPos : p))

      animateSteps(cp, fromPos, toPos, STEP_MS * 0.8, () => {
        if (toPos === TRACK_LENGTH) {
          setWinner(cp)
          setPhase('gameover')
          setChallenge(null)
        } else {
          setChallenge(null)
          passTurn(cp)
        }
      })
    }, 1400)
  }, [challenge, positions, currentPlayer, racers, animateSteps, passTurn, talk])

  // ── Read aloud: questions & cards as they appear, and whose turn it is ──────
  const challengeKey = challenge ? (challenge.say || challenge.question || challenge.text) : null
  useEffect(() => {
    if (!challenge || challenge.answered !== null) return
    if (challenge.type === 'question') { if (pictureMode && voiceOn) readChallenge(challenge, true) }
    else talk(`${challenge.text}! ${challenge.desc}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeKey, talk])

  useEffect(() => {
    if (phase !== 'playing' || animating || challenge) return
    const r = racers[currentPlayer]
    if (r) talk(`${r.name}, it's your turn! Tap the dice.`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayer, phase])

  useEffect(() => {
    if (phase === 'gameover' && winner != null) talk(`Hooray! ${racers[winner]?.name} wins the adventure!`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, winner])

  // ── Setup screen ─────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="adventure-screen screen">
        <motion.div
          className="adventure-setup"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } }}
        >
          <div className="adv-setup-header">
            <button className="btn btn-secondary back-btn" onClick={onBack}>← Back</button>
            <h2 className="adv-setup-title">🗺️ Adventure!</h2>
            <div />
          </div>

          {/* Reading level */}
          <h3 className="adv-setup-h">Who's playing?</h3>
          <div className="adv-mode-btns">
            {[
              { id: 'read',    icon: '📖', title: 'I can read',       sub: 'Fun trivia questions' },
              { id: 'picture', icon: '🧸', title: 'Little explorer', sub: 'Pictures + a voice reads everything — no reading needed' },
            ].map(m => (
              <motion.button
                key={m.id}
                className={`adv-mode-btn ${mode === m.id ? 'selected' : ''}`}
                onClick={() => {
                  setMode(m.id)
                  try { localStorage.setItem('adv-mode', m.id) } catch { /* ignore */ }
                  if (m.id === 'picture' && voiceOn) speak('Little explorer! I will read everything to you.')
                }}
                whileHover={{ scale: 1.04, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.96 }}
              >
                <span className="adv-mode-icon">{m.icon}</span>
                <span className="adv-mode-title">{m.title}</span>
                <span className="adv-mode-sub">{m.sub}</span>
              </motion.button>
            ))}
          </div>

          {/* Player count */}
          <h3 className="adv-setup-h">How many adventurers?</h3>
          <div className="player-count-btns">
            {[2, 3, 4].map(n => (
              <motion.button
                key={n}
                className={`player-count-btn ${playerCount === n ? 'selected' : ''}`}
                onClick={() => setPlayerCount(n)}
                whileHover={{ scale: 1.08, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="pcb-racers">
                  {theme.raceRacers.slice(0, n).map(r => (
                    <RacerAvatar key={r.id} racer={r} />
                  ))}
                </div>
                <div className="pcb-label">{n} Players</div>
              </motion.button>
            ))}
          </div>
          <motion.button
            className="btn btn-primary setup-start-btn"
            onClick={() => startGame(playerCount)}
            whileHover={{ scale: 1.06, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.95 }}
          >
            Start Adventure!
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // ── Game-over screen ──────────────────────────────────────────────────────────
  if (phase === 'gameover') {
    return (
      <div className="adventure-screen screen">
        <div className="game-header">
          <button className="btn btn-secondary back-btn" onClick={onBack}>← Back</button>
          <h2>🗺️ Adventure!</h2>
          <div />
        </div>
        <motion.div
          className="gameover"
          variants={gameoverVariants}
          initial="initial"
          animate="animate"
        >
          <div className="gameover-emoji"><RacerAvatar racer={racers[winner]} /></div>
          <h2>{racers[winner]?.name} wins the Adventure!</h2>
          <p>Landed exactly on step 80! 🏆</p>
          <div className="gameover-btns">
            <button className="btn btn-primary"   onClick={() => startGame(playerCount)}>Play Again</button>
            <button className="btn btn-secondary" onClick={() => setPhase('setup')}>Change Players</button>
            <button className="btn btn-secondary" onClick={onBack}>Menu</button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Playing screen ────────────────────────────────────────────────────────────
  const currentRacer = racers[currentPlayer]

  return (
    <div className="adventure-screen screen">
      <div className="adv-play">
        {/* ── Board ── */}
        <div className="board-wrapper">
          <div
            className="board"
            style={
              theme.id === 'dinosaurs'
                ? { backgroundImage: "url('/boards/dino/adventure-dino (2).webp')" }
                : theme.id === 'robots'
                ? { backgroundImage: "url('/boards/robots/adventure-robots.webp')" }
                : theme.id === 'sea'
                ? { backgroundImage: "url('/boards/underwater/adventure-underwater.webp')" }
                : theme.id === 'space'
                ? { backgroundImage: "url('/boards/space/adveture-space.webp')" }
                : undefined
            }
          >

            {/* Road ribbon */}
            <svg className="adv-road" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path d={ROAD_D} className="adv-road-shadow" />
              <path d={ROAD_D} className="adv-road-fill" />
              {ROAD_D2 && <>
                <path d={ROAD_D2} className="adv-road-shadow adv-road-cosmic-shadow" />
                <path d={ROAD_D2} className="adv-road-fill adv-road-cosmic" />
              </>}
            </svg>

            {/* Theme icon — covers AI watermark in board corner */}
            <img
              src={`/themes/${
                theme.id === 'dinosaurs' ? 'Dino'
                : theme.id === 'robots'  ? 'Robots'
                : theme.id === 'sea'     ? 'Underwater'
                : theme.id === 'space'   ? 'Space'
                : 'Animals'
              }/head-fox.png`}
              alt=""
              className="adv-board-watermark-cover"
            />

            {/* Path tiles */}
            {PATH.map((pt, idx) => {
              const isStart    = idx === 0
              const isFinish   = idx === TRACK_LENGTH
              const isShortcut = Object.prototype.hasOwnProperty.call(SHORTCUTS, idx)
              // Priority: bonus > shortcut > surprise > question
              const tileKind = isStart || isFinish ? null
                             : isBonus(idx)    ? 'bonus'
                             : isShortcut      ? 'shortcut'
                             : isSurprise(idx) ? 'surprise'
                             : isQuestion(idx) ? 'question'
                             : null
              const isCosmic = ROAD_D2 && idx > SPACE_HOLE_TILE
              const cls = ['adv-tile',
                isStart  ? 'is-start'  : '',
                isFinish ? 'is-finish' : '',
                tileKind ? `is-${tileKind}` : '',
                isCosmic ? 'is-cosmic' : '',
              ].filter(Boolean).join(' ')
              const label = isStart             ? 'START'
                          : isFinish            ? <><span className="finish-trophy">🏆</span><span className="finish-label">FINISH</span></>
                          : tileKind === 'shortcut' ? `↑${SHORTCUTS[idx]}`
                          : tileKind === 'bonus'    ? '🌟'
                          : tileKind === 'surprise' ? <img src="/themes/other-icons/exclamation.svg" alt="" style={{ width: '1em', height: '1em', objectFit: 'contain', display: 'block' }} />
                          : tileKind === 'question' ? '?'
                          : idx
              return (
                <div
                  key={idx}
                  className={cls}
                  style={{
                    left: `${pt.x}%`, top: `${pt.y}%`,
                    transform: `translate(-50%,-50%) rotate(${ANG[idx].toFixed(1)}deg)`
                  }}
                >
                  <span className="adv-tile-n"
                        style={{ transform: `rotate(${(-ANG[idx]).toFixed(1)}deg)` }}>{label}</span>
                </div>
              )
            })}

            {/* Player tokens */}
            {racers.map((r, i) => {
              const pos = displayPos[i] ?? 0
              const pt  = PATH[pos]
              const off = T_OFF[i] || T_OFF[0]
              const isCur = i === currentPlayer
              const tokSpring = { type: 'spring', stiffness: 280, damping: 28, mass: 0.6 }
              return (
                <React.Fragment key={r.id}>
                  <motion.div
                    className={`player-token${isCur ? ' is-current' : ''}`}
                    animate={{
                      left: `calc(${pt.x}% + ${off.dx}px)`,
                      top:  `calc(${pt.y}% + ${off.dy}px)`,
                    }}
                    transition={tokSpring}
                    style={{ '--tok-color': r.color }}
                  >
                    <span className="token-pnum">{i + 1}</span>
                  </motion.div>
                  <motion.div
                    className={`token-emoji-head${isCur ? ' is-current' : ''}`}
                    animate={{
                      left: `calc(${pt.x}% + ${off.dx}px)`,
                      top:  `calc(${pt.y}% + ${off.dy}px - 32px)`,
                    }}
                    transition={tokSpring}
                  >
                    <RacerAvatar racer={r} />
                  </motion.div>
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="adv-sidebar">
          <div className="adv-sidebar-header">
            <div className="adv-game-title">🗺️ Adventure!</div>
            {pictureMode && canSpeak && (
              <button
                className={`adv-voice-btn${voiceOn ? ' on' : ''}`}
                onClick={() => { const v = !voiceOn; setVoiceOn(v); if (v) speak('I will read to you.'); else stopSpeaking() }}
                title={voiceOn ? 'Voice on' : 'Voice off'}
              >
                {voiceOn ? '🔊 Voice on' : '🔇 Voice off'}
              </button>
            )}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentRacer?.id}
                className="adv-turn-info"
                style={{ '--turn-col': currentRacer?.color }}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }}
                exit={{ opacity: 0, y: 8, transition: { duration: 0.14, ease: 'easeIn' } }}
              >
                <span className="adv-turn-emoji"><RacerAvatar racer={currentRacer} /></span>
                {currentRacer?.name}'s turn
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="adv-players">
            {racers.map((r, i) => (
              <div
                key={r.id}
                className={`adv-player-row${i === currentPlayer ? ' is-active' : ''}`}
                style={{ '--row-col': r.color }}
              >
                {i === currentPlayer && <span className="adv-player-arrow">▶</span>}
                <span className="adv-player-emoji"><RacerAvatar racer={r} /></span>
                <span className="adv-player-name">{r.name}</span>
                {sleepers[i] && <span className="adv-player-sleep">💤</span>}
                <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={positions[i] ?? 0}
                  className="adv-player-pos"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } }}
                  exit={{ opacity: 0, y: 6, transition: { duration: 0.12 } }}
                >{positions[i] ?? 0}/{TRACK_LENGTH}</motion.span>
              </AnimatePresence>
              </div>
            ))}
          </div>

          <div className="dice-area">
            <DiceFace value={diceValue} rolling={rolling} />
          </div>

          <motion.button
            className="btn btn-primary draw-btn"
            onClick={rollDice}
            disabled={animating || rolling || !!challenge}
            whileHover={(!animating && !rolling && !challenge) ? { scale: 1.06, transition: { duration: 0.15 } } : {}}
            whileTap={(!animating && !rolling && !challenge) ? { scale: 0.95 } : {}}
          >
            {rolling ? '🎲 Rolling...' : animating ? '✨ Moving...' : '🎲 Roll Dice!'}
          </motion.button>

          <div className="log-box">
            <AnimatePresence initial={false}>
              {log.map((l, i) => (
                <motion.div
                  key={l + i}
                  className="log-line"
                  initial={{ opacity: 0, x: 18, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto', transition: { duration: 0.28, ease: 'easeOut' } }}
                  exit={{ opacity: 0, height: 0, transition: { duration: 0.18, ease: 'easeIn' } }}
                >{l}</motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Challenge / card modal ── */}
      <AnimatePresence>
        {challenge && (
          <motion.div
            className="challenge-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } }}
            exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }}
          >
            <motion.div
              className={`challenge-panel${challenge.type !== 'question' ? ' card-panel' : ''}`}
              initial={{ scale: 0.88, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0,
                transition: { type: 'spring', stiffness: 220, damping: 26, mass: 0.9 } }}
              exit={{ scale: 0.92, opacity: 0, y: 16,
                transition: { duration: 0.18, ease: 'easeIn' } }}
            >
              {challenge.type === 'question' ? (
                <>
                  <div className="challenge-header">
                    <div className="challenge-stars">{'⭐'.repeat(Math.max(1, challenge.stars || 1))}</div>
                    <div className="challenge-reward">Answer right for +3 steps!</div>
                  </div>
                  <div className="challenge-who">
                    <RacerAvatar racer={currentRacer} /> {currentRacer?.name}'s turn
                  </div>
                  {challenge.picture ? (
                    <div className="challenge-question pic-question">
                      {challenge.prompt && <div className="pic-prompt">{challenge.prompt}</div>}
                      <div className="pic-say">{challenge.say}</div>
                    </div>
                  ) : (
                    <div className={`challenge-question${readingIdx === -1 ? ' reading' : ''}`}>{challenge.question}</div>
                  )}
                  {canSpeak && (
                    <button className="btn btn-secondary listen-btn" onClick={() => readChallenge(challenge)}>
                      🔊 {challenge.picture ? 'Listen again' : 'Read it to me'}
                    </button>
                  )}
                  <div className={`challenge-options${challenge.picture ? ' pic-options' : ''}${challenge.options.length === 2 ? ' two' : ''}`}>
                    {challenge.options.map((opt, i) => {
                      const answered = challenge.answered !== null
                      let cls = 'challenge-opt'
                      if (readingIdx === i && !answered) cls += ' reading'
                      if (answered) {
                        if (i === challenge.correctIdx)    cls += ' correct'
                        else if (i === challenge.answered) cls += ' wrong'
                        else                               cls += ' dim'
                      }
                      return (
                        <button
                          key={i}
                          className={cls}
                          disabled={answered}
                          onClick={() => resolveChallenge(i)}
                        >
                          {challenge.picture ? <PictureOption opt={opt} /> : (
                            <>
                              <span className="opt-letter">{LETTERS[i]}</span>
                              <span className="opt-text">{opt}</span>
                            </>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="card-reveal">
                  <div className={`card-reveal-badge ${challenge.type === 'bonus' ? 'bonus' : 'surprise'}`}>
                    {challenge.type === 'bonus' ? 'BIG BONUS' : 'SURPRISE'}
                  </div>
                  <div className="card-reveal-emoji">{challenge.emoji}</div>
                  <div className="card-reveal-title">{challenge.text}</div>
                  <div className="card-reveal-desc">{challenge.desc}</div>
                  {challenge.delta !== 0 && (
                    <div className="card-reveal-delta">
                      {challenge.delta >= 0 ? '+' : ''}{challenge.delta} steps
                    </div>
                  )}
                  {pictureMode && canSpeak && (
                    <button className="btn btn-secondary listen-btn" onClick={() => speak(`${challenge.text}! ${challenge.desc}`)}>
                      🔊 Listen again
                    </button>
                  )}
                  <button className="btn btn-primary" onClick={collectCard}>
                    Collect!
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
