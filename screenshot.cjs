const puppeteer = require('puppeteer');

const takeScreenshot = async (role, email, path, viewport) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  if (viewport) await page.setViewport(viewport);

  // Clear any persistent storage just in case
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.removeItem('supabase_user'));

  // Login
  if (email) {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', email);
    await page.type('input[type="password"]', '123');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 2000));
  }

  // Navigate to target
  let targetUrl = 'http://localhost:5173/' + role;
  if (role === 'cliente') targetUrl = 'http://localhost:5173/cliente/00000000-0000-0000-0000-000000000000?mesa=1';
  
  await page.goto(targetUrl, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path });
  await browser.close();
};

(async () => {
  const mobileViewport = { width: 390, height: 844 };
  const desktopViewport = { width: 1280, height: 800 };

  console.log('Capturing admin...');
  await takeScreenshot('admin', 'admin@teste.com', 'screenshot_admin.png', desktopViewport);
  
  console.log('Capturing cozinha...');
  await takeScreenshot('cozinha', 'cozinha@teste.com', 'screenshot_cozinha.png', desktopViewport);
  
  console.log('Capturing garcom...');
  await takeScreenshot('garcom', 'garcom@teste.com', 'screenshot_garcom.png', mobileViewport);
  
  console.log('Capturing cliente...');
  await takeScreenshot('cliente', null, 'screenshot_cliente.png', mobileViewport);

  console.log("All screenshots captured!");
})();
