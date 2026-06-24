const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--ignore-certificate-errors']
  });
  const page = await browser.newPage();
  
  let capturedPayload = null;
  
  page.on('console', async (msg) => {
    if (msg.text().includes('RENDER PAYLOAD')) {
      const args = msg.args();
      if (args.length > 1) {
        try {
          const payload = await args[1].jsonValue();
          // We only want to capture when source is demo_upe or supabase
          if (payload && payload.source !== 'restricted') {
            capturedPayload = payload;
            console.log('Payload captured!');
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  });

  console.log('Navigating to login...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  
  console.log('Filling out form...');
  await page.type('input[type="email"]', 'admin@aeternumatlas.com');
  await page.type('input[type="password"]', 'AeternumDemo2026!');
  
  console.log('Clicking login...');
  await page.click('button[type="submit"]');
  
  console.log('Waiting for payload...');
  // Wait up to 10 seconds for capturedPayload to be populated
  for(let i=0; i<20; i++) {
    if (capturedPayload) break;
    await new Promise(r => setTimeout(r, 500));
  }
  
  if (capturedPayload) {
    fs.writeFileSync('captured_payload.json', JSON.stringify(capturedPayload, null, 2));
    console.log('Saved payload to captured_payload.json');
  } else {
    console.log('No payload captured.');
  }

  await browser.close();
})();
