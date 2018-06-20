import { parse, join } from 'path'
import { uniqBy, last } from 'lodash'
import { remote, shell } from 'electron'

import {
  getFilesPaths,
  getFilesRecursivePaths,
  getAbsolutePath,
  loadJsonAsync
} from '../../utils/file-utils'


const centralityUserUrl = join(remote.app.getPath('userData'), 'settings')
const settingsUrl = join(centralityUserUrl, 'plugin-file.settings.json')

let cached;
const name = 'File System'
const keyword = '__file__'

const fileModel = (model, icon ) => {
  return {
    value: model.value,
    path: model.path,
    _path: model._path,
    icon
  }
}

const init = async () => {
  const {
    shortcutPaths,
    shortcutRecursivePaths,
    acceptedExtensions
  } = await loadJsonAsync(settingsUrl)

  const flatPaths = await Promise.all(shortcutPaths.map(path =>
    getFilesPaths(path)
  ))

  const recursivePaths = await Promise.all(shortcutRecursivePaths.map( path =>
    getFilesRecursivePaths(path)
  ))

  const paths = [...flatPaths, ...recursivePaths]
    .reduce((a,b)=> [...a,...b])
    .filter( path =>
      !!acceptedExtensions.find( extension => extension === last(path.split('.')))
    )

  const partialFileModel = await Promise.all(paths.map( async path => {
    const absolutePath = await getAbsolutePath(path)
    return  {
      value: parse(path).name,
      path: absolutePath,
      _path: path
    }
  })).then( resp => uniqBy(resp, item => item.path))


  cached = partialFileModel.map( (model) => {
    const path_b64 = new Buffer(model._path).toString('base64');
    const iconUrl = `icon://${path_b64}`
    return fileModel( model, iconUrl )
  })
}

const onEnter = (query, item) => {
  if (!item) {
    return
  }
  shell.openItem(item._path)
}
export const plugin = tools => {
  const queryResults = (query) => {
    if (query === '') {
      return []
    }
    return tools.filterList(cached, query)
  }
  return {
    name,
    keyword,
    init,
    queryResults,
    onEnter
  }
}
