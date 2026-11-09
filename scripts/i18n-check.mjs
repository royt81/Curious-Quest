// Lists every English text used with t('…') / tr('…') that has no German line yet.
// Also lists names/labels from data files that are shown through t().
// Usage: npm run i18n:check   (add --stub to print ready-to-paste lines)
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const de = (await import(join(root, 'src/i18n/de.js'))).default

function walk(dir) {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : /\.(jsx?|mjs)$/.test(f) ? [p] : []
  })
}

// t('text') / tr('text') / t("text") — plain string literals only
const CALL = /\btr?\(\s*(['"])((?:\\.|(?!\1).)*)\1/g
// texts in data that are passed through t() at display time
const DATA = /\b(?:name|label|desc|world|title|goal|tip|prompt|text|sub):\s*(['"])((?:\\.|(?!\1).)*)\1/g
// say('…', '…') helpers in Chess/Checkers, and lists marked with // i18n: list
const SAY = /\bsay\(\s*(['"])((?:\\.|(?!\1).)*)\1\s*,\s*(['"])((?:\\.|(?!\3).)*)\3/g
const LIST = /\/\/ i18n: list\n[^\n]*\[([^\]]*)\]/g
const STR = /(['"])((?:\\.|(?!\1).)*)\1/g
const STEP = /\[\s*'[^']*',\s*(['"])((?:\\.|(?!\1).)*)\1\s*\]/g

const unescape = (s, q) => s.replace(new RegExp('\\\\' + q, 'g'), q).replace(/\\\\/g, '\\')
// games that are not in the menu (kept in the code, not translated)
const SKIP = ['/games/Foursomes/', '/games/LetterHunt/', '/games/NumberQuest/']
// data files whose names are not shown (or not translatable, like the Impressum)
const DATA_SKIP = ['data/animals.js', 'data/legal.js', 'data/pieces.js', 'Adventure/pictureQuestions.js']
const found = new Map()
for (const file of walk(join(root, 'src'))) {
  if (file.includes('/i18n/') || SKIP.some(d => file.includes(d))) continue
  let src = readFileSync(file, 'utf8')
  // card-game families are only used by the hidden Foursomes game
  src = src.replace(/quartettFamilies:\s*\[[\s\S]*?\n  \],/g, '')
  const add = (text) => { if (/[A-Za-z]{2}/.test(text) && !found.has(text)) found.set(text, file.replace(root, '')) }
  const rel = file.replace(root, '')
  const res = [CALL]
  if (!DATA_SKIP.some(d => rel.endsWith(d))) res.push(DATA)
  if (rel.endsWith('data/howToPlay.js')) res.push(STEP)   // [icon, text] rule lines
  for (const re of res) for (const m of src.matchAll(re)) add(unescape(m[2], m[1]))
  for (const m of src.matchAll(SAY)) { add(unescape(m[2], m[1])); add(unescape(m[4], m[3])) }
  for (const m of src.matchAll(LIST)) for (const q of m[1].matchAll(STR)) add(unescape(q[2], q[1]))
}
const missing = [...found].filter(([text]) => !(text in de))
if (process.argv.includes('--stub')) {
  for (const [text, file] of missing) console.log(`  ${JSON.stringify(text)}: '', // ${file}`)
} else {
  for (const [text, file] of missing) console.log(`${file}: ${text}`)
  console.log(`\n${missing.length} of ${found.size} texts have no German translation yet.`)
}
