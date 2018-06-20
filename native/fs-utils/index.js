
const native = require('./addon.node')

export const fetchPath = path => {
  return new Promise( resolve => {
    native.findPath(path, globalPath => resolve(globalPath))
  })
}
