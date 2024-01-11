import fs from 'node:fs';
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const manifest = {
  manifest_version: 2,
  default_locale: 'en',
  name: 'TEMU Extension',
  version: packageJson.version,
  description: 'This is an extension for TEMU website',
  permissions: ['storage', 'tabs', '<all_urls>'],
  background: {
    scripts: ['src/pages/background/index.js'],
  },
  browser_action: {
    default_popup: 'src/pages/popup/index.html',
    default_icon: 'icon.png',
  },
  icons: {
    128: 'icon-128.png',
  },
  content_scripts: [
    {
      matches: ['https://www.temu.com/*'],
      js: ['src/pages/content/index.js'],
      css: ['assets/css/contentStyle<KEY>.chunk.css'],
    },
  ],
  web_accessible_resources: ['assets/js/*.js', 'assets/css/*.css', 'icon-128.png'],
};

export default manifest;
