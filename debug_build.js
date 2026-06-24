const { execSync } = require('child_process');
try {
  console.log("Running vite build...");
  const output = execSync('npx vite build', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  console.log("BUILD OK");
} catch (e) {
  const fs = require('fs');
  fs.writeFileSync('build_error.log', e.stdout + '\n' + e.stderr);
  console.log("BUILD FAILED, check build_error.log");
}
