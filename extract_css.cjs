const fs = require('fs');
const html = fs.readFileSync('C:\\Users\\gabri\\.gemini\\antigravity-ide\\brain\\26e5a473-93a3-4358-8f62-eb15687d1004\\scratch\\prototype.html', 'utf8');
const matches = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)];
console.log('Found', matches.length, 'style tags');
matches.sort((a, b) => b[1].length - a[1].length);
let css = matches[0][1].trim();
// add our anchor fix at the start
css = css.replace('button{font:inherit;color:inherit;cursor:pointer}', 'button{font:inherit;color:inherit;cursor:pointer}\na{color:inherit;text-decoration:none}');
fs.writeFileSync('C:\\Users\\gabri\\Documents\\projeto Quiosq\\mesaflow\\src\\styles\\prototype.css', css);
console.log('Replaced prototype.css with largest style tag');
