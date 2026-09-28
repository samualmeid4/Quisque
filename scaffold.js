import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  'src/layouts/AdminLayout.jsx',
  'src/layouts/GarcomLayout.jsx',
  'src/layouts/CozinhaLayout.jsx',
  'src/layouts/PublicLayout.jsx',
  'src/pages/Login.jsx',
  'src/pages/admin/Dashboard.jsx',
  'src/pages/admin/Pedidos.jsx',
  'src/pages/admin/Mesas.jsx',
  'src/pages/admin/Cardapio.jsx',
  'src/pages/garcom/Mesas.jsx',
  'src/pages/garcom/Cardapio.jsx',
  'src/pages/cozinha/Painel.jsx',
  'src/pages/cliente/CardapioPublico.jsx',
  'src/pages/cliente/Carrinho.jsx'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const componentName = path.basename(file, '.jsx');
  
  // Layouts wrap children via Outlet
  let content = '';
  if (file.includes('Layout')) {
    content = `import React from 'react';
import { Outlet } from 'react-router-dom';

export default function ${componentName}() {
  return (
    <div className="layout ${componentName.toLowerCase()}">
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <strong>${componentName} Navbar</strong>
      </nav>
      <main className="container" style={{ padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
`;
  } else {
    content = `import React from 'react';

export default function ${componentName}() {
  return (
    <div className="page ${componentName.toLowerCase()}">
      <h1>${componentName}</h1>
    </div>
  );
}
`;
  }
  
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content);
  }
});

console.log('Scaffold complete!');
