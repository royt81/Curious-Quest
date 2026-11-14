// How the games are grouped — used by both the sidebar and the main menu,
// so the two always show the same order. A new game just goes into a group here.
export const GAME_GROUPS = [
  { id: 'learn',  label: 'Learn',                 icon: '📚', games: ['adventure', 'quiz'] },
  { id: 'puzzle', label: 'Puzzles',               icon: '🧩', games: ['memory', 'mahjong', 'blocks', 'life'] },
  { id: 'board',  label: 'Board & card games',    icon: '♟️', games: ['chess', 'checkers', 'backgammon', 'snakes', 'uno'] },
  { id: 'create', label: 'Create',                icon: '🎨', games: ['draw'] },
]
