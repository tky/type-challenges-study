import path from 'node:path'
import process from 'node:process'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import fs from 'fs-extra'
import fg from 'fast-glob'
import c from 'ansis'

const root = path.join(__dirname, '..')
const playgroundPath = path.join(root, 'playground')
const playgroundCachePath = path.join(root, '.playgroundcache')

// Mirrors tsconfig.base.json + tsconfig.json, since passing files on the
// command line makes tsc ignore any tsconfig it would otherwise pick up.
// noUnusedLocals/noUnusedParameters are deliberately off: `type cases = [...]`
// and the fixture functions in test-cases are unused by design, so those
// diagnostics fire no matter how correct the answer is.
const compilerFlags = [
  '--noEmit',
  '--strict',
  '--target',
  'es2017',
  // `dom` is added on top of tsconfig.base's `esnext`: a few questions
  // (00006, 00213) use `alert` in their test cases.
  '--lib',
  'esnext,dom',
  '--module',
  'commonjs',
  '--moduleResolution',
  'node',
  '--esModuleInterop',
  '--skipLibCheck',
  '--noImplicitReturns',
  '--noUnusedLocals',
  'false',
  '--noUnusedParameters',
  'false',
  '--pretty',
  'false',
]

interface Quiz {
  /** absolute path */
  file: string
  /** e.g. `easy/00004-easy-pick.ts` */
  rel: string
  /** e.g. `00004-easy-pick.ts` */
  base: string
  /** e.g. `easy` */
  difficulty: string
  no: number
}

// Same digest as scripts/generate-play.ts, so the cache written by
// `pnpm generate` can be compared against.
function calculateFileHash(filePathFull: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1')
    const fileStream = fs.createReadStream(filePathFull)

    fileStream.on('data', data => hash.update(data))
    fileStream.on('end', () => {
      hash.update(filePathFull)
      resolve(hash.digest('hex'))
    })
    fileStream.on('error', reject)
  })
}

async function loadQuizFiles(): Promise<Quiz[]> {
  const files = await fg('*/*.ts', { cwd: playgroundPath, onlyFiles: true })

  return files.sort().map((rel) => {
    const base = path.basename(rel)
    return {
      file: path.join(playgroundPath, rel),
      rel,
      base,
      difficulty: path.dirname(rel),
      no: Number.parseInt(base, 10),
    }
  })
}

/** Files whose content differs from what `pnpm generate` produced. */
async function findTouched(quizzes: Quiz[]): Promise<Quiz[]> {
  const cache: Record<string, string> = fs.existsSync(playgroundCachePath)
    ? await fs.readJSON(playgroundCachePath).catch(() => ({}))
    : {}

  const touched: Quiz[] = []
  for (const quiz of quizzes) {
    const cached = cache[quiz.base]
    // No cache entry means we can't tell whether it was touched, so include it.
    if (!cached || cached !== await calculateFileHash(quiz.file))
      touched.push(quiz)
  }
  return touched
}

function select(quizzes: Quiz[], selectors: string[]): Quiz[] {
  const selected = new Set<Quiz>()

  for (const selector of selectors) {
    const matches = /^\d+$/.test(selector)
      ? quizzes.filter(q => q.no === Number(selector))
      : quizzes.filter(q =>
        q.difficulty === selector.toLowerCase()
        || q.base.includes(selector.toLowerCase()),
      )

    if (!matches.length) {
      console.log(c.yellow`No question matched "${selector}". Skipping.`)
      continue
    }
    matches.forEach(q => selected.add(q))
  }

  return quizzes.filter(q => selected.has(q))
}

interface TscError {
  line: number
  message: string
}

function runTsc(quizzes: Quiz[]): Map<string, TscError[]> {
  const { stdout } = spawnSync(
    path.join(root, 'node_modules/.bin/tsc'),
    [...compilerFlags, ...quizzes.map(q => q.file)],
    { cwd: root, encoding: 'utf-8', maxBuffer: 1024 * 1024 * 32 },
  )

  const errors = new Map<string, TscError[]>()

  for (const line of (stdout || '').split('\n')) {
    // e.g. `playground/easy/00004-easy-pick.ts(31,3): error TS2344: ...`
    const match = line.match(/^(.+?)\((\d+),\d+\): (error .+)$/)
    if (!match)
      continue

    const rel = path.relative(playgroundPath, path.resolve(root, match[1]))
    if (!errors.has(rel))
      errors.set(rel, [])
    errors.get(rel)!.push({ line: Number(match[2]), message: match[3] })
  }

  return errors
}

async function check() {
  if (!fs.existsSync(playgroundPath)) {
    console.log(c.red('No playground found.'))
    console.log(c.cyan('Run "pnpm generate ja" first.'))
    process.exit(1)
  }

  const args = process.argv.slice(2)
  const all = args.includes('--all') || args.includes('-a')
  const selectors = args.filter(a => !a.startsWith('-'))

  const quizzes = await loadQuizFiles()
  let targets: Quiz[]

  if (selectors.length)
    targets = select(quizzes, selectors)
  else if (all)
    targets = quizzes
  else
    targets = await findTouched(quizzes)

  if (!targets.length) {
    console.log(c.yellow('Nothing to check.'))
    console.log(c.dim('Edit a question in playground/, or pass a number: "pnpm check 4"'))
    return
  }

  console.log(c.bold.cyan`Type checking ${targets.length} question(s)...\n`)

  const errors = runTsc(targets)
  let passed = 0

  for (const quiz of targets) {
    const quizErrors = errors.get(quiz.rel)

    if (!quizErrors?.length) {
      passed++
      console.log(`${c.green('✓')} ${quiz.rel}`)
      continue
    }

    console.log(`${c.red('✗')} ${c.bold(quiz.rel)}`)
    for (const { line, message } of quizErrors)
      console.log(c.dim(`    ${quiz.rel}:${line}`), c.red(message))
  }

  const failed = targets.length - passed
  console.log()
  console.log(
    failed
      ? c.bold.red`${failed} failed` + c.dim(', ') + c.green`${passed} passed`
      : c.bold.green`All ${passed} passed 🎉`,
  )

  if (failed)
    process.exit(1)
}

check()
