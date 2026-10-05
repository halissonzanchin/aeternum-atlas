import https from 'node:https';

async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('--- Checking www.aeternumatlas.com ---');
  const home = await fetchUrl('https://www.aeternumatlas.com');
  console.log('HTTP Status:', home.status);
  console.log('Headers:', {
    'server': home.headers['server'],
    'x-vercel-id': home.headers['x-vercel-id'],
    'age': home.headers['age'],
    'content-type': home.headers['content-type']
  });

  const apex = await fetchUrl('https://aeternumatlas.com');
  console.log('Apex HTTP Status:', apex.status, 'location:', apex.headers['location']);

  const regex = /src="(\/assets\/[^"]+\.js)"/g;
  let match;
  while ((match = regex.exec(home.body)) !== null) {
    const assetPath = match[1];
    const assetUrl = 'https://www.aeternumatlas.com' + assetPath;
    console.log('\nChecking asset:', assetPath);
    const asset = await fetchUrl(assetUrl);
    console.log('  Status:', asset.status, 'size:', asset.body.length);
    console.log('  hyivyrietgjdazgizafp (prod):', asset.body.includes('hyivyrietgjdazgizafp'));
    console.log('  hutohshswppahipgcwio (staging):', asset.body.includes('hutohshswppahipgcwio'));
    console.log('  localhost:', asset.body.includes('localhost'));
    console.log('  institutional_standby:', asset.body.includes('institutional_standby'));
  }
}

run().catch(console.error);
