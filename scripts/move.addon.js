const { mkdirSync, copyFileSync, openSync } = require('fs');
const { resolve } = require('path');

const fileName = 'e81634501a3d870faa304d464ac6781b.node'
const root = resolve(__dirname, '..')

const distAppUrl = resolve(root, 'builds', 'centrality-win32-x64',  'dist');
mkdirSync(distAppUrl)

const nodeAddonFile = resolve(root, 'dist', fileName);
const filePath = resolve(distAppUrl, fileName)
openSync(filePath, 'w')
copyFileSync(nodeAddonFile, filePath)
