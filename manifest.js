import fs from 'node:fs';
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const manifest = {
  manifest_version: 3,
  default_locale: 'en',
  name: 'TEMU Extension',
  version: packageJson.version,
  description: 'This is an extension for TEMU website',
  permissions: ['storage', 'tabs', 'scripting', 'activeTab'],
  host_permissions: ['https://www.temu.com/*'],
  action: {
    default_popup: 'src/pages/popup/index.html',
    default_icon: 'icon.png',
  },
  icons: {
    128: 'icon-128.png',
  },
  background: {
    service_worker: 'src/pages/background/index.js',
  },
  content_scripts: [
    {
      matches: ['https://www.temu.com/*'],
      js: ['src/pages/content/index.js'],
    },
  ],
  web_accessible_resources: [
    {
      resources: ['assets/js/*.js', 'assets/css/*.css', 'icon-128.png'],
      matches: ['https://www.temu.com/*'],
    },
  ],
};

export default manifest;
