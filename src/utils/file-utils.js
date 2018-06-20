import { lstat, readFile, readdir } from 'fs'
import { join } from 'path'
import recursive from 'recursive-readdir'

import { fetchPath } from '../../native/fs-utils';

const isFile = path => {
  return new Promise( (resolve, reject) =>
  lstat(path, (err, stats) => {
      if (err) return reject(err);
      resolve(stats.isFile())
    })
  )
}

const readdirAsync = path => {
  return new Promise( (resolve, reject) =>
  readdir(path, (err, files) => {
      if (err) return reject(err);
      resolve(files)
    })
  )
}

export const getFilesPaths = path =>
  readdirAsync(path).then(files => {
    return Promise.all(
      files.map(name => join(path, name)).filter(isFile)
    )
  })

export const getFilesNames = path => readdirAsync(path)

export const getFilesRecursivePaths = path => 
  new Promise((resolve, reject) => 
    recursive(path, (err, files) => {
      if (err) return reject(err)
      resolve(files)
    })
)

export const getAbsolutePath = async path => {
  const absolutePath =  await fetchPath(path)
  return absolutePath === '' ? path : absolutePath
}

export const loadJsonAsync = path => {
  return new Promise( resolve =>
    readFile(path, 'utf8', (err, data) => {
      if (err) return resolve({});
      resolve(JSON.parse(data))
    })
  )
}
