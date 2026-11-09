// ─── "How to play" for every game ─────────────────────────────────────────────
// Short, child-friendly rules. Each game has a goal and up to ~5 steps,
// each step an emoji + one short sentence. Shown from the sidebar's
// "❓ How to play" button, automatically the first time a game is opened,
// and the 🔊 button reads it aloud for children who can't read yet.
// Keep these in sync with the games' real rules when a game changes.

export const HOW_TO_PLAY = {
  adventure: {
    title: 'Adventure!',
    goal: 'Be the first explorer to reach the finish!',
    steps: [
      ['🎲', 'Roll the dice and walk that many tiles.'],
      ['❓', 'Purple tiles ask a question. Right answer: 3 steps forward! Wrong: 1 step back.'],
      ['❗', 'Orange tiles give a surprise card — it can be good or tricky!'],
      ['⭐', 'Yellow star tiles give a bonus.'],
      ['⬆️', 'Green tiles are shortcuts that jump you ahead.'],
    ],
    tip: 'Can\'t read yet? Choose "Little explorer" — then a voice reads everything and the answers are pictures.',
  },
  quiz: {
    title: 'Quiz Race',
    goal: 'Answer questions to race your runner to the finish line first!',
    steps: [
      ['🧠', 'A question appears — maths, letters or words.'],
      ['👆', 'Tap the answer you think is right.'],
      ['🏃', 'A right answer moves your runner forward.'],
      ['🏁', 'The first runner to reach the finish wins!'],
    ],
    tip: 'Turn on "Read the questions to me" or tap 🔊 to hear a question.',
  },
  race: {
    title: 'Race',
    goal: 'Cheer on the animals racing to the finish line!',
    steps: [
      ['🃏', 'Tap the deck to draw a card.'],
      ['🐾', 'A card with an animal moves that animal forward 1 to 5 steps.'],
      ['⛈️', 'Storm: everyone still racing goes back 1.'],
      ['🚀', 'Boost: the leader jumps 2 ahead. 🔀 Swap: first and last swap places!'],
      ['🥇', 'The race ends when three animals have finished — gold, silver and bronze!'],
    ],
  },
  memory: {
    title: 'Memory',
    goal: 'Find all the matching pairs!',
    steps: [
      ['👆', 'Tap a card to turn it over.'],
      ['👀', 'Tap another card. Is it the same picture?'],
      ['✅', 'Same picture? Great — the pair stays open!'],
      ['🔄', 'Different? They turn back over. Try to remember where they were!'],
      ['🏆', 'Find every pair to win. Try to use as few moves as you can.'],
    ],
  },
  mahjong: {
    title: 'Mahjong',
    goal: 'Take away all the tiles from the pile!',
    steps: [
      ['👆', 'Tap a bright tile, then tap another bright tile with the same picture.'],
      ['🔓', 'A tile is free when no tile lies on top of it and its left or right side is open. Dark tiles are stuck for now.'],
      ['✨', 'Same picture? Both tiles disappear!'],
      ['💡', 'Stuck? Tap Hint to see a pair, or Shuffle to mix the pictures. ↩️ Undo takes back your last pair.'],
      ['🏆', 'Clear the whole board to win. Fewer helps = more stars!'],
    ],
    tip: 'Start with tiles on top of the pile and at the ends of long rows. On Hard, think before you take a pair — the wrong pair can leave you stuck!',
  },
  uno: {
    title: 'Colour Clash',
    goal: 'Be the first to play all of your cards!',
    steps: [
      ['🎨', 'Play a card with the same colour OR the same number as the top card.'],
      ['🃏', 'No card you can play? Tap the deck to take one.'],
      ['🚫', 'Skip and 🔄 Reverse: you get another turn straight away.'],
      ['➕', '+2 and +4: the other player takes extra cards, and you go again.'],
      ['🌈', 'Rainbow cards can go on anything — then you choose the colour.'],
    ],
  },
  checkers: {
    title: 'Checkers',
    goal: 'Take all of the other player\'s pieces — or leave them with no moves!',
    steps: [
      ['↗️', 'Move one piece diagonally forward to an empty dark square.'],
      ['🦘', 'Jump over an enemy piece to take it. You can keep jumping if another jump is ready!'],
      ['👑', 'Reach the far side and your piece becomes a King — Kings move backwards too.'],
      ['👆', 'Tap your piece, then tap one of the green dots.'],
    ],
  },
  chess: {
    title: 'Chess',
    goal: 'Trap the other King so it can\'t escape — that\'s checkmate!',
    steps: [
      ['♟️', 'Pawns walk forward one step (two on their first move) and take diagonally.'],
      ['♜', 'Rooks go straight. ♝ Bishops go diagonally. ♛ The Queen goes both ways!'],
      ['♞', 'Knights jump in an L shape — they can hop over pieces.'],
      ['♚', 'The King moves one step any way. Keep him safe!'],
      ['👆', 'Tap a piece to see where it can go, then tap a dot.'],
    ],
  },
  domino: {
    title: 'Domino',
    goal: 'Be the first to play all of your tiles!',
    steps: [
      ['🁣', 'Each tile has two numbers of dots.'],
      ['🔗', 'Play a tile whose number matches one end of the line.'],
      ['📦', 'Can\'t play? Draw a tile from the pile.'],
      ['🏆', 'First with no tiles left wins. If nobody can play, the fewest dots wins.'],
    ],
  },
  backgammon: {
    title: 'Backgammon',
    goal: 'Bring all 15 of your pieces home and take them off the board first!',
    steps: [
      ['🎲', 'Roll two dice. Move a piece by each number. A double gives you four moves!'],
      ['🔢', 'Your pieces travel from point 24 down to point 1.'],
      ['🚫', 'You can\'t land where the other player has 2 or more pieces.'],
      ['💥', 'Land on a single enemy piece to send it to the middle bar — it has to start again.'],
      ['🏠', 'When all your pieces are in your home (points 1–6), move them off the board to win.'],
    ],
  },
  dotsboxes: {
    title: 'Dots & Boxes',
    goal: 'Close more boxes than the other player!',
    steps: [
      ['✏️', 'Take turns drawing one line between two dots next to each other.'],
      ['⬛', 'Draw the fourth side of a box and it\'s yours!'],
      ['🔁', 'Closed a box? You get another turn.'],
      ['🏆', 'When all the boxes are taken, the one with the most boxes wins.'],
    ],
    tip: 'Careful: don\'t draw the third side of a box — the other player can close it!',
  },
  snakes: {
    title: 'Snakes & Ladders',
    goal: 'Be the first to reach square 64!',
    steps: [
      ['🎲', 'Roll the dice and move that many squares.'],
      ['🪜', 'Land at the bottom of a ladder? Climb up!'],
      ['🐍', 'Land on a snake\'s head? Slide down to its tail.'],
      ['🎯', 'You need the exact number to land on 64.'],
    ],
  },
  draw: {
    title: 'Draw & Paint',
    goal: 'Draw anything you like, or colour in a picture!',
    steps: [
      ['🖌️', 'Brush: draw with your finger or the mouse. Pick a size and a colour.'],
      ['🪣', 'Fill: tap an area to paint it all at once.'],
      ['⭐', 'Stickers: tap the page to add a sticker.'],
      ['🧽', 'Eraser rubs out. ↩️ Undo takes back your last step.'],
      ['💾', 'Save picture keeps your drawing on the device.'],
    ],
  },
  life: {
    title: 'Game of Life',
    goal: 'Draw some cells and watch what grows!',
    steps: [
      ['✏️', 'Tap squares to make living cells, or stamp a pattern.'],
      ['▶️', 'Press Play — every cell looks at its 8 neighbours.'],
      ['😢', 'Too few or too many neighbours: the cell disappears.'],
      ['🐣', 'An empty square with exactly 3 neighbours: a new cell is born!'],
    ],
    tip: 'Tap "❓ How it works" in the game for pictures of every rule.',
  },
}

// One string for the read-aloud voice.
export function spokenRules(info) {
  return [
    `How to play ${info.title}.`,
    info.goal,
    ...info.steps.map(([, text]) => text),
    info.tip ?? '',
  ].join(' ')
}
