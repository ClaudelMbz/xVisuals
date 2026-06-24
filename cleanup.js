import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('=== Running Workspace Git Initialization & Recovery ===');

function runCmd(cmd) {
  try {
    console.log(`Executing: ${cmd}`);
    const output = execSync(cmd, { encoding: 'utf8' });
    console.log(`Output:\n${output}`);
    return output;
  } catch (err) {
    console.error(`Error executing "${cmd}":`, err instanceof Error ? err.message : String(err));
    return null;
  }
}

try {
  let hasGit = false;
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    hasGit = true;
    console.log('Existing Git repository detected.');
  } catch (e) {
    console.log('No git repository found in current directory tree.');
  }

  if (!hasGit) {
    console.log('Initializing git repository...');
    runCmd('git init');
  }

  // Set default configurations to avoid Git complaints
  runCmd('git config --local user.email "claudel.mubenzem@2028.icam.fr"');
  runCmd('git config --local user.name "ClaudelMbz"');
  // Avoid errors with older git versions by naming branch main
  runCmd('git checkout -b main || git branch -m main');

  // Configure remote if requested by user: ClaudelMbz/xVisuals on main
  try {
    const existingRemotes = execSync('git remote', { encoding: 'utf8' }).trim();
    if (!existingRemotes.includes('origin')) {
      console.log('Setting remote origin to ClaudelMbz/xVisuals on GitHub.');
      runCmd('git remote add origin https://github.com/ClaudelMbz/xVisuals.git');
    } else {
      console.log('Remote "origin" already exists, updating url.');
      runCmd('git remote set-url origin https://github.com/ClaudelMbz/xVisuals.git');
    }
  } catch (remErr) {
    console.error('Remote configuration error:', remErr);
  }

  // Check and delete index.lock if present
  const gitDir = path.join(process.cwd(), '.git');
  if (fs.existsSync(gitDir)) {
    const lockPath = path.join(gitDir, 'index.lock');
    if (fs.existsSync(lockPath)) {
      console.log('Stale lock file index.lock found! Removing...');
      fs.unlinkSync(lockPath);
    }
  }

  // Stage all elements in the workspace to reflect complete codebase
  console.log('Staging files...');
  runCmd('git add .');

  // Show status
  console.log('Verifying final Git Status:');
  runCmd('git status --short');

} catch (err) {
  console.error('General error during Git Recovery:', err);
}

console.log('=== Recovery Finished ===');
