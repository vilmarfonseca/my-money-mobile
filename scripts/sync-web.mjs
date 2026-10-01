#!/usr/bin/env node
/**
 * Pulls the code the native app shares with the web app (my-money-v2) into
 * `src/lib/`, mirroring the web repo's paths so `@/lib/...` imports read the
 * same in both codebases.
 *
 * Two kinds of file come across:
 *
 *  - Pure modules (messages, formatters, scope calculators, plan rules) are
 *    copied as source, because the app runs them.
 *  - Server modules (queries, actions, the API registry) are copied as type
 *    declarations only. They describe what the API returns and accepts; the
 *    code itself stays on the server. Import from them with `import type`.
 *
 * Which is which is worked out from the imports: a module is pure when
 * neither it nor anything it imports at runtime touches a server package.
 *
 *   npm run sync:web                 # ../my-money-v2
 *   WEB_REPO=/path/to/repo npm run sync:web
 *
 * Generated files carry a header and are listed in `src/lib/.synced.json`;
 * files in `src/lib/` that are not in that manifest belong to this repo and
 * are never touched.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = path.resolve(process.env.WEB_REPO ?? path.join(mobileRoot, '..', 'my-money-v2'));
const webLib = path.join(webRoot, 'src', 'lib');
const mobileLib = path.join(mobileRoot, 'src', 'lib');
const manifestPath = path.join(mobileLib, '.synced.json');

/** The API registry: everything it references is needed at least as types. */
const API_ENTRY = 'mobile/api.ts';

/** Bare packages a module may import and still run in the native app. */
const NATIVE_SAFE_PACKAGES = new Set(['react', 'lucide-react', 'clsx', 'xlsx']);

/** Rewritten on the way in: same exports, native implementation. */
const PACKAGE_ALIASES = { 'lucide-react': 'lucide-react-native' };

/**
 * Pure by their imports, but bound to the browser or to web-only features.
 * The native app has its own versions of these, or no use for them.
 */
const SKIPPED = [
  /^i18n\/provider\.tsx$/,
  /^i18n\/public-paths\.ts$/,
  /^i18n\/country-locale\.ts$/,
  /^use-mounted\.ts$/,
  /^use-tap\.ts$/,
  /^utils\.ts$/,
  /^source\.ts$/,
  /^social\.ts$/,
  /^table-styles\.ts$/,
  /^contact\//,
  /^consent\//,
  /^marketing\//,
  /^seo\//,
  /^og\//,
  /^pwa\//,
  /^theme\//,
  /^geo\//,
  /^email\//,
  /^test-support\//,
  /^admin\/admin-access\.ts$/,
  /^db\/sample-user\.ts$/,
  /^routes\//,
  /^analytics\/track\.ts$/,
  /^analytics\/marketing-signal\.ts$/,
  /^billing\/sign-up-link\.ts$/,
  /^onboarding\/coachmark-storage\.ts$/,
  /^onboarding\/use-coachmark-delay\.ts$/,
  /^transactions\/parse-transaction-file\.ts$/,
  /\.test\.tsx?$/,
];

if (!fs.existsSync(path.join(webLib, API_ENTRY))) {
  console.error(
    `Could not find ${path.join('src/lib', API_ENTRY)} in ${webRoot}.\n` +
      'Point WEB_REPO at a my-money-v2 checkout that has the mobile API.',
  );
  process.exit(1);
}

const ts = createRequire(path.join(webRoot, 'package.json'))('typescript');

// --- 1. Read every lib module's imports ------------------------------------

function listModules(dir, base = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...listModules(path.join(dir, entry.name), rel));
    else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) out.push(rel);
  }
  return out;
}

function resolveLibImport(fromRel, specifier) {
  let target;
  if (specifier.startsWith('@/lib/')) target = specifier.slice('@/lib/'.length);
  else if (specifier.startsWith('.')) {
    target = path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), specifier));
  } else return null;

  for (const candidate of [`${target}.ts`, `${target}.tsx`, `${target}/index.ts`]) {
    if (fs.existsSync(path.join(webLib, candidate))) return candidate;
  }
  return null;
}

function readImports(rel) {
  const text = fs.readFileSync(path.join(webLib, rel), 'utf8');
  const source = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, false);
  const imports = [];
  let usesServer = /^\s*["']use server["']/m.test(text);

  for (const statement of source.statements) {
    const isImport = ts.isImportDeclaration(statement);
    const isReExport = ts.isExportDeclaration(statement) && statement.moduleSpecifier;
    if (!isImport && !isReExport) continue;

    const specifier = statement.moduleSpecifier.text;
    let typeOnly = false;
    if (isImport) {
      const clause = statement.importClause;
      if (clause) {
        const named = clause.namedBindings;
        typeOnly =
          clause.isTypeOnly ||
          (!clause.name &&
            named &&
            ts.isNamedImports(named) &&
            named.elements.length > 0 &&
            named.elements.every((element) => element.isTypeOnly));
      }
    } else {
      typeOnly = statement.isTypeOnly;
    }

    imports.push({ specifier, typeOnly });
  }

  return { imports, usesServer };
}

const modules = new Map();
for (const rel of listModules(webLib)) modules.set(rel, readImports(rel));

// --- 2. Classify: pure (runs in the app) or server (types only) -------------

const purity = new Map();
function isPure(rel, trail = new Set()) {
  if (purity.has(rel)) return purity.get(rel);
  if (trail.has(rel)) return true; // import cycle: decided by the other members
  trail.add(rel);

  const info = modules.get(rel);
  let pure = !info.usesServer;
  for (const { specifier, typeOnly } of info.imports) {
    if (!pure) break;
    if (typeOnly) continue;
    const target = resolveLibImport(rel, specifier);
    if (target) pure = isPure(target, trail);
    else if (specifier.startsWith('@/') || specifier.startsWith('.')) pure = false;
    else pure = NATIVE_SAFE_PACKAGES.has(specifier);
  }

  purity.set(rel, pure);
  return pure;
}

const skipped = (rel) => SKIPPED.some((pattern) => pattern.test(rel));
const pureModules = [...modules.keys()].filter((rel) => !skipped(rel) && isPure(rel)).sort();

// --- 3. Emit declarations for the API and everything the pure code types ----

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mymoney-sync-'));
const tsconfigPath = path.join(outDir, 'tsconfig.json');
fs.writeFileSync(
  tsconfigPath,
  JSON.stringify({
    extends: path.join(webRoot, 'tsconfig.json'),
    compilerOptions: {
      noEmit: false,
      declaration: true,
      emitDeclarationOnly: true,
      incremental: false,
      removeComments: false,
      outDir: path.join(outDir, 'out'),
      rootDir: webRoot,
      baseUrl: webRoot,
      paths: { '@/*': ['./src/*'] },
      plugins: [],
    },
    include: [],
    files: [
      path.join(webRoot, 'next-env.d.ts'),
      path.join(webLib, API_ENTRY),
      ...pureModules.map((rel) => path.join(webLib, rel)),
    ],
  }),
);

try {
  execFileSync(path.join(webRoot, 'node_modules', '.bin', 'tsc'), ['-p', tsconfigPath], {
    cwd: webRoot,
    stdio: 'inherit',
  });
} catch {
  console.error('\nDeclaration emit failed; nothing was synced.');
  process.exit(1);
}

const emittedLib = path.join(outDir, 'out', 'src', 'lib');
const declarations = listDeclarations(emittedLib);

function listDeclarations(dir, base = '') {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...listDeclarations(path.join(dir, entry.name), rel));
    else if (entry.name.endsWith('.d.ts')) out.push(rel);
  }
  return out;
}

// --- 4. Write ----------------------------------------------------------------

const header = (rel) =>
  `// Synced from my-money-v2 (src/lib/${rel}). Do not edit here: change it\n` +
  '// in the web repo and run `npm run sync:web`.\n';

function adapt(text) {
  let out = text;
  for (const [from, to] of Object.entries(PACKAGE_ALIASES)) {
    out = out.replaceAll(`"${from}"`, `"${to}"`).replaceAll(`'${from}'`, `'${to}'`);
  }
  return out;
}

const previous = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')).files
  : [];
const written = [];

function write(rel, content) {
  const target = path.join(mobileLib, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  written.push(rel);
}

const pureSet = new Set(pureModules);
for (const rel of pureModules) {
  write(rel, header(rel) + adapt(fs.readFileSync(path.join(webLib, rel), 'utf8')));
}

// tsc emits a declaration for every module the server code runs through
// (schema, Stripe client, mailer, ...). Only the ones the API's types or the
// pure modules actually name are worth carrying.
const stemOf = (rel) => rel.replace(/\.d\.ts$|\.tsx?$/, '');
const declarationStems = new Set(declarations.map(stemOf));
const pureStems = new Set(pureModules.map(stemOf));

function referencedStems(fromStem, text) {
  const found = new Set();
  const pattern = /(?:from\s+|import\()\s*["']([^"']+)["']/g;
  for (const match of text.matchAll(pattern)) {
    const specifier = match[1];
    let target = null;
    if (specifier.startsWith('@/lib/')) target = specifier.slice('@/lib/'.length);
    else if (specifier.startsWith('.')) {
      target = path.posix.normalize(path.posix.join(path.posix.dirname(fromStem), specifier));
    }
    if (target && (declarationStems.has(target) || pureStems.has(target))) found.add(target);
  }
  return found;
}

const neededDeclarations = new Set();
const queue = [stemOf(API_ENTRY), ...pureStems];
const seen = new Set(queue);
while (queue.length > 0) {
  const stem = queue.pop();
  const isPureModule = pureStems.has(stem);
  if (!isPureModule) neededDeclarations.add(stem);
  const file = isPureModule
    ? path.join(webLib, pureModules.find((rel) => stemOf(rel) === stem))
    : path.join(emittedLib, `${stem}.d.ts`);
  for (const next of referencedStems(stem, fs.readFileSync(file, 'utf8'))) {
    if (!seen.has(next)) {
      seen.add(next);
      queue.push(next);
    }
  }
}

let typeOnlyCount = 0;
for (const declaration of declarations) {
  const stem = declaration.slice(0, -'.d.ts'.length);
  if (pureSet.has(`${stem}.ts`) || pureSet.has(`${stem}.tsx`)) continue;
  if (skipped(`${stem}.ts`) || skipped(`${stem}.tsx`)) continue;
  if (!neededDeclarations.has(stem)) continue;
  const body = fs
    .readFileSync(path.join(emittedLib, declaration), 'utf8')
    // A side-effect import of a server package has no meaning in a declaration.
    .replace(/^import ["'][^"']+["'];\n/gm, '');
  write(declaration, header(`${stem}.ts`) + adapt(body));
  typeOnlyCount += 1;
}

for (const stale of previous.filter((rel) => !written.includes(rel))) {
  fs.rmSync(path.join(mobileLib, stale), { force: true });
}

const git = (...args) => execFileSync('git', args, { cwd: webRoot }).toString().trim();
// The web repo's working tree may be ahead of its last commit; say so.
const webCommit = git('rev-parse', '--short', 'HEAD') + (git('status', '--porcelain') ? '+dirty' : '');
fs.writeFileSync(
  manifestPath,
  `${JSON.stringify({ source: 'my-money-v2', commit: webCommit, files: written.sort() }, null, 2)}\n`,
);
fs.rmSync(outDir, { recursive: true, force: true });

console.log(
  `Synced from ${webRoot} @ ${webCommit}: ${pureModules.length} modules as source, ` +
    `${typeOnlyCount} as type declarations.`,
);
