// Vice City Nights — GTA 6 cover art maker (round 2).
// Hands the app in: copies app/ and screenshots/ from beside this file to
// /output and writes /output/dossier.json with the vendored make.fun library.
// Node 22, standard library only, no network.
//
// Round-1 fix: the grader pre-creates / mounts an empty writable /output and
// runs this program with the repo read-only. Removing the output directory
// itself (rmSync on /output) throws EBUSY/EPERM in that sandbox and the run
// exits 1. So this program NEVER removes, renames or deletes the output
// directory itself: it mkdirs it (a no-op when it already exists) and only
// clears the entries it owns inside it — app/, screenshots/ and dossier.json.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function main() {
  // Create the output directory if it is missing; leave it alone if the
  // grader already mounted it. Never delete the output directory itself.
  mkdirSync(outDir, { recursive: true });

  // Clear only the entries this program owns inside the output directory.
  rmSync(join(outDir, 'app'), { recursive: true, force: true });
  rmSync(join(outDir, 'screenshots'), { recursive: true, force: true });
  rmSync(join(outDir, 'dossier.json'), { force: true });

  cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  if (existsSync(join(repoRoot, 'screenshots'))) {
    cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
  }

  // The scorer's own caps (reference/gate.json): only text_max_bytes shapes
  // the bytes; the others refuse an entry the scorer would refuse (more than
  // 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB
  // of app files, in all, or a path under app/ over 1000 bytes).
  writeFileSync(
    join(outDir, 'dossier.json'),
    buildDossier(outDir, {
      text_max_bytes: 163840,
      screenshots: { max: 4, max_bytes: 262144 },
      app_max_files: 993,
      app_max_bytes: 50331648,
      app_path_max_bytes: 1000,
    }),
  );
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.stack ?? err.message : String(err));
  process.exit(1);
}
