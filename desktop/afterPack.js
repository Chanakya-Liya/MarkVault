// electron-builder's own icon step needs symlink privileges on some Windows setups,
// so it is disabled (signAndEditExecutable: false) and the icon is embedded here.
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

function findRcedit() {
  const cache = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'electron-builder', 'Cache', 'winCodeSign')
  for (const d of fs.existsSync(cache) ? fs.readdirSync(cache) : []) {
    const p = path.join(cache, d, 'rcedit-x64.exe')
    if (fs.existsSync(p)) return p
  }
  return null
}

exports.default = async function (context) {
  const exe = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`)
  const rcedit = findRcedit()
  if (!rcedit) { console.warn('rcedit not found; exe icon not embedded'); return }
  execFileSync(rcedit, [exe, '--set-icon', path.join(__dirname, 'build', 'icon.ico'),
    '--set-version-string', 'ProductName', 'MarkVault',
    '--set-version-string', 'FileDescription', 'MarkVault'])
}
