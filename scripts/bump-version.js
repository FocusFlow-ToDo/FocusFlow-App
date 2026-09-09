#!/usr/bin/env node

/**
 * FocusFlow Version Bumper
 * 
 * Usage:
 *   node scripts/bump-version.js patch   → 0.1.0 → 0.1.1  (version-small)
 *   node scripts/bump-version.js minor   → 0.1.0 → 0.2.0  (version-medium)
 *   node scripts/bump-version.js major   → 0.1.0 → 1.0.0  (version-large)
 */

const fs = require('fs');
const path = require('path');

const bumpType = process.argv[2]; // patch | minor | major

if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error('❌ Geçersiz parametre! Kullanım: node bump-version.js [patch|minor|major]');
  process.exit(1);
}

// Read package.json
const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const oldVersion = pkg.version;

// Parse version
const parts = oldVersion.split('.').map(Number);

if (bumpType === 'major') {
  parts[0] += 1;
  parts[1] = 0;
  parts[2] = 0;
} else if (bumpType === 'minor') {
  parts[1] += 1;
  parts[2] = 0;
} else if (bumpType === 'patch') {
  parts[2] += 1;
}

const newVersion = parts.join('.');
pkg.version = newVersion;

// Write package.json (preserve formatting)
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

// Also update package-lock.json if exists
const lockPath = path.join(__dirname, '..', 'package-lock.json');
if (fs.existsSync(lockPath)) {
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  lock.version = newVersion;
  // Also update the root package entry if it exists
  if (lock.packages && lock.packages['']) {
    lock.packages[''].version = newVersion;
  }
  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n', 'utf8');
}

// Update LoadingScreen fallback version if it has a hardcoded one
const loadingScreenPath = path.join(__dirname, '..', 'components', 'ui', 'LoadingScreen.tsx');
if (fs.existsSync(loadingScreenPath)) {
  let content = fs.readFileSync(loadingScreenPath, 'utf8');
  // Replace version patterns like "0.1.0" in useState or similar
  const versionRegex = /useState\(["'](\d+\.\d+\.\d+)["']\)/g;
  const updated = content.replace(versionRegex, `useState("${newVersion}")`);
  if (updated !== content) {
    fs.writeFileSync(loadingScreenPath, updated, 'utf8');
    console.log(`   📄 LoadingScreen.tsx güncellendi`);
  }
}

// Update settings page fallback version
const settingsPath = path.join(__dirname, '..', 'app', 'settings', 'page.tsx');
if (fs.existsSync(settingsPath)) {
  let content = fs.readFileSync(settingsPath, 'utf8');
  const versionRegex = /useState\(["'](\d+\.\d+\.\d+)["']\)/g;
  const updated = content.replace(versionRegex, `useState("${newVersion}")`);
  if (updated !== content) {
    fs.writeFileSync(settingsPath, updated, 'utf8');
    console.log(`   📄 settings/page.tsx güncellendi`);
  }
}

console.log('');
console.log(`   🚀 FocusFlow Versiyon Güncellendi!`);
console.log(`   ───────────────────────────────`);
console.log(`   📦 ${oldVersion} → ${newVersion}`);
console.log(`   📝 Bump tipi: ${bumpType}`);
console.log('');
