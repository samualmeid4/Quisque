const fs = require('fs');
const html = fs.readFileSync('C:\\Users\\gabri\\.gemini\\antigravity-ide\\brain\\26e5a473-93a3-4358-8f62-eb15687d1004\\scratch\\prototype.html', 'utf8');
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (styleMatch) {
  const css = styleMatch[1].trim();
  fs.writeFileSync('C:\\Users\\gabri\\Documents\\projeto Quiosq\\mesaflow\\src\\styles\\prototype.css', css);
  console.log('Replaced prototype.css');
}
