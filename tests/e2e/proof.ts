import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from '@playwright/test';

/**
 * Where a proof picture (screenshot or frame sheet) is saved. Normally under the test's own output folder
 * (test-results/, not committed), so running the tests leaves the checkout unchanged. With UPDATE_PROOF=1 it goes
 * to the committed docs folder instead, to refresh the pictures there on purpose:
 *   UPDATE_PROOF=1 npx playwright test tests/e2e/pond-art.spec.ts
 */
export function proofPath(docsDir: string, file: string): string {
  const path = process.env.UPDATE_PROOF === '1' ? join(docsDir, file) : test.info().outputPath(file);
  mkdirSync(dirname(path), { recursive: true });
  return path;
}
