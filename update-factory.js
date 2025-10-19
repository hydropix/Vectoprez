const fs = require('fs');
let content = fs.readFileSync('src/lib/engine/elements/factory.ts', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('originalBounds: null,'));
if (idx !== -1) {
  lines.splice(idx + 1, 0,
    '    shadowEnabled: options.shadowEnabled ?? false,',
    '    shadowBlur: options.shadowBlur ?? 10,',
    '    shadowOffsetX: options.shadowOffsetX ?? 0,',
    '    shadowOffsetY: options.shadowOffsetY ?? 2,',
    '    shadowOpacity: options.shadowOpacity ?? 30,'
  );
  fs.writeFileSync('src/lib/engine/elements/factory.ts', lines.join('\n'));
  console.log('Done!');
} else {
  console.log('Pattern not found');
}
