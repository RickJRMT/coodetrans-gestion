#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const cwd = path.resolve(__dirname, '..');
const electronPkgDir = path.join(cwd, 'node_modules', 'electron');
const electronBinName = process.platform === 'win32'
  ? 'electron.exe'
  : process.platform === 'darwin'
    ? 'Electron.app/Contents/MacOS/Electron'
    : 'electron';
const electronBinPath = path.join(electronPkgDir, 'dist', electronBinName);
const betterSqlite3Dir = path.join(cwd, 'node_modules', 'better-sqlite3');
const betterSqlite3Binary = path.join(betterSqlite3Dir, 'build', 'Release', 'better_sqlite3.node');

function exists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function run(command, args, description) {
  console.log(`[native-deps] ${description}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    throw new Error(`${description} failed with exit code ${result.status ?? 'unknown'}`);
  }
}

function ensureElectron() {
  if (exists(electronBinPath)) {
    console.log('[native-deps] Electron binary found.');
    return;
  }

  console.log('[native-deps] Electron binary missing. Running electron installer...');
  run(process.execPath, [path.join(electronPkgDir, 'install.js')], 'Installing Electron runtime');

  if (!exists(electronBinPath)) {
    throw new Error('Electron binary still missing after installation.');
  }
}

function findRebuildCli() {
  const candidates = [
    path.join(cwd, 'node_modules', '@electron', 'rebuild', 'lib', 'cli.js'),
    path.join(cwd, 'node_modules', 'electron-rebuild', 'lib', 'cli.js'),
  ];

  for (const candidate of candidates) {
    if (exists(candidate)) {
      return candidate;
    }
  }

  try {
    return path.join(path.dirname(require.resolve('@electron/rebuild/package.json', { paths: [cwd] })), 'lib', 'cli.js');
  } catch {
    try {
      return path.join(path.dirname(require.resolve('electron-rebuild/package.json', { paths: [cwd] })), 'lib', 'cli.js');
    } catch {
      return null;
    }
  }
}

function ensureBetterSqlite3() {
  if (exists(betterSqlite3Binary)) {
    console.log('[native-deps] better-sqlite3 native binary found.');
    return;
  }

  console.log('[native-deps] better-sqlite3 native binary missing. Rebuilding...');
  const electronRebuildCli = findRebuildCli();
  if (!electronRebuildCli) {
    throw new Error('No Electron rebuild CLI was found.');
  }

  run(process.execPath, [electronRebuildCli, '-f', '-w', 'better-sqlite3'], 'Rebuilding better-sqlite3 for Electron');

  if (!exists(betterSqlite3Binary)) {
    throw new Error('better-sqlite3 native binary still missing after rebuild.');
  }
}

try {
  ensureElectron();
  ensureBetterSqlite3();
  console.log('[native-deps] Native dependencies ready.');
} catch (error) {
  console.error(`[native-deps] ${error.message}`);
  process.exit(1);
}
