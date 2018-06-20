const del = require('del')
const { resolve } = require('path');

const root = resolve(__dirname, '..')
const builds = resolve(root, 'builds')
const dist = resolve(root, 'dist')

del([builds, dist])