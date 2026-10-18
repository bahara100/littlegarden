import { defineConfig, type Plugin } from 'vite';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { availableParallelism } from 'node:os';
import { join, relative, sep } from 'node:path';

/**
 * public/ also holds art review pages and old sprite versions for the dev server. The built game keeps only what it
 * uses: Vite's own output plus every public file under a `sprites/...` or `music/...` path that the built code or pages mention
 * (e.g. 'sprites/scarlet/ingame-approved-v1', or `sprites/garden/${file}.png` for the whole sprites/garden/ folder).
 * New art and songs (music.ts) are deployed as soon as the game references them; nothing has to be listed by hand.
 * The kept PNGs are then recompressed losslessly with oxipng when it is installed (same pixels, smaller files); the
 * art in public/ and docs/ is never touched, so approved sheets stay byte-identical to their records.
 */
function gameFilesOnly(): Plugin {
  let outDir = '';
  const emitted = new Set<string>();
  return {
    name: 'game-files-only',
    apply: 'build',
    configResolved(config) { outDir = config.build.outDir.startsWith('/') || /^[A-Za-z]:/.test(config.build.outDir) ? config.build.outDir : join(config.root, config.build.outDir); },
    // The page itself is added to the bundle after this hook runs, so it is kept by name.
    generateBundle(_options, bundle) { emitted.add('index.html'); for (const name of Object.keys(bundle)) emitted.add(name); },
    closeBundle() {
      const files: string[] = [];
      const walk = (dir: string) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) walk(path); else files.push(relative(outDir, path).split(sep).join('/')); } };
      walk(outDir);
      const prefixes = new Set<string>();
      for (const file of files) {
        if (!emitted.has(file) || !/\.(js|html|css)$/.test(file)) continue;
        for (const match of readFileSync(join(outDir, file), 'utf8').matchAll(/(?:sprites|music)\/[\w./-]*/g)) prefixes.add(match[0]);
      }
      const used = (file: string) => emitted.has(file) || [...prefixes].some(p => file === p || file.startsWith(p.endsWith('/') ? p : `${p}/`));
      let removed = 0;
      for (const file of files) if (!used(file)) { rmSync(join(outDir, file)); removed++; }
      const prune = (dir: string): boolean => {
        let empty = true;
        for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory() ? !prune(path) : true) empty = false; }
        if (empty && dir !== outDir) rmSync(dir, { recursive: true });
        return empty;
      };
      prune(outDir);
      this.info?.(`kept ${files.length - removed} files, left out ${removed} review/history files`);
      const pngs = files.filter(f => used(f) && f.endsWith('.png')).map(f => join(outDir, f));
      if (process.env.OXIPNG === 'off') { this.info?.('oxipng off (OXIPNG=off): PNGs left as they are'); return; }
      const oxipng = findOxipng();
      if (!oxipng) { this.info?.('oxipng not found: PNGs left as they are (install with `winget install Shssoichiro.Oxipng`)'); return; }
      const before = pngs.reduce((n, f) => n + statSync(f).size, 0);
      // On GitHub use every core; on the player's own computer at most half, so the machine stays usable.
      const threads = process.env.CI ? availableParallelism() : Math.max(1, Math.floor(availableParallelism() / 2));
      const run = spawnSync(oxipng, ['-o', '4', '--strip', 'safe', '-q', '-t', String(threads), ...pngs], { stdio: 'inherit' });
      if (run.status !== 0) throw new Error(`oxipng failed (exit ${run.status})`);
      const after = pngs.reduce((n, f) => n + statSync(f).size, 0);
      this.info?.(`oxipng: ${pngs.length} PNGs ${(before / 1e6).toFixed(2)} MB → ${(after / 1e6).toFixed(2)} MB`);
    },
  };
}

/** oxipng from OXIPNG, PATH, or winget's links folder (a shell opened before installing has the old PATH). */
function findOxipng(): string | null {
  if (process.env.OXIPNG) return process.env.OXIPNG;
  const exe = process.platform === 'win32' ? 'oxipng.exe' : 'oxipng';
  for (const dir of (process.env.PATH ?? '').split(process.platform === 'win32' ? ';' : ':')) if (dir && existsSync(join(dir, exe))) return join(dir, exe);
  const links = join(process.env.LOCALAPPDATA ?? '', 'Microsoft', 'WinGet', 'Links', 'oxipng.exe');
  return process.platform === 'win32' && existsSync(links) ? links : null;
}

export default defineConfig({ base: './', plugins: [gameFilesOnly()], build: { chunkSizeWarningLimit: 1500 /* the Phaser chunk is ~1.4 MB and loads after the page */, rollupOptions: { input: { main: fileURLToPath(new URL('./index.html', import.meta.url)) } } } });
