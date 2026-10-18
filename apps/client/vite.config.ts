import { defineConfig, type Plugin } from 'vite';
import { fileURLToPath } from 'node:url';
import { readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * public/ also holds art review pages and old sprite versions for the dev server. The built game keeps only what it
 * uses: Vite's own output plus every public file under a `sprites/...` path that the built code or pages mention
 * (e.g. 'sprites/scarlet/ingame-approved-v1', or `sprites/garden/${file}.png` for the whole sprites/garden/ folder).
 * New art is deployed as soon as the game references it; nothing has to be listed by hand.
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
        for (const match of readFileSync(join(outDir, file), 'utf8').matchAll(/sprites\/[\w./-]*/g)) prefixes.add(match[0]);
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
    },
  };
}

export default defineConfig({ base: './', plugins: [gameFilesOnly()], build: { rollupOptions: { input: { main: fileURLToPath(new URL('./index.html', import.meta.url)) } } } });
