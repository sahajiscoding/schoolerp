#!/usr/bin/env node
/**
 * Typecheck every workspace, including the Expo app which has no `typecheck`
 * script of its own (Expo owns that build, so we only ask tsc for diagnostics).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
// Fixed workspace allowlist; paths are never built from untrusted input.
const workspaces = ['apps/admin', 'apps/mobile', 'packages/shared'];
let failed = false;

for (const ws of workspaces) {
  const pkgPath = path.join(root, ws, 'package.json');
  if (!existsSync(pkgPath)) continue;
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const localTsc = path.join(root, 'node_modules/.bin/tsc');

  const hasLocalScript = Boolean(pkg.scripts?.typecheck);
  const hasTsconfig = existsSync(path.join(ws, 'tsconfig.json'));

  if (!hasLocalScript && !hasTsconfig) {
    console.log(`— ${ws}: no tsconfig, skipped`);
    continue;
  }

  // A workspace whose own dependencies are not installed cannot be checked;
  // report it clearly instead of failing the run with "cannot find module".
  const depsInstalled = hasLocalScript || existsSync(path.join(root, ws, 'node_modules'));
  if (!depsInstalled) {
    console.log(`— ${ws}: dependencies not installed, skipped (npm ci in that workspace to check)`);
    continue;
  }

  console.log(`\n▶ ${ws}`);
  const result = hasLocalScript
    ? spawnSync('npm', ['run', 'typecheck', `--workspace=${pkg.name}`], { stdio: 'inherit', cwd: root })
    : spawnSync(localTsc, ['--noEmit', '--skipLibCheck', '-p', path.join(ws, 'tsconfig.json')], {
        stdio: 'inherit',
        cwd: root,
      });
  if (result.status !== 0) failed = true;
}

process.exit(failed ? 1 : 0);
