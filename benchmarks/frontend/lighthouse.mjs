import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import fs from 'fs';

const chrome = await launch({ chromeFlags: ['--headless'] });
const options = { logLevel: 'info', output: 'html', port: chrome.port };

const result = await lighthouse('https://pwrnow.pl', options);
fs.writeFileSync('lighthouse-report.html', result.report);

await chrome.kill();
console.log('✅ Report saved as lighthouse-report.html');
