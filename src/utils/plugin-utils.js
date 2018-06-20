import { remote } from 'electron'

export const pluginPayload = (preview, name, onEnter) => {
  return { preview, name, onEnter }
}

export const ensurePluginContextFormat = partialContext => {
  return {
    name: partialContext.name  || '',
    preview: partialContext.preview || (() => {}),
    getList: partialContext.getList || (() => []),
    onEnter: partialContext.onEnter || (() => {}),
    onClose: partialContext.onClose || (() => {}),
    payload: partialContext.payload
  }
}

export const ensurePluginFormat = partialPlugin => {
  return {
    name: partialPlugin.name  || '',
    queryResults: partialPlugin.queryResults || (() => []),
    preview: partialPlugin.preview || (() => {}),
    onEnter: partialPlugin.onEnter || (() => {}),
    onClose: partialPlugin.onClose || (() => {}),
    payload: partialPlugin.payload
  }
}

export const removeSpaces = (query) => {
  return query.replace(/\s+/g,' ').trim()
}

export const splitQuery = (query) => {
  const [name, ...rest] = query.split(' ')
  return [name, rest.join(' ')]
}

export const getIconFromUrl = async path => {
  return new Promise((resolve,reject) => {
    remote.app.getFileIcon(path, (err, icon) => {
      if (err) return reject(err)
      resolve(icon.toDataURL())
    })
  })
}
