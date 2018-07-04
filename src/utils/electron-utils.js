import { ipcRenderer, remote } from 'electron';

export const setInitPosition = () => {
  const win = remote.getCurrentWindow()
  const height = win.getSize()[1]
  win.setSize(700, height)
  win.center()
  const x = win.getPosition()[0]
  win.setPosition(x, 100)
}

export const openDevTools = () => {
  const win = remote.getCurrentWindow()
  if (!win.webContents.isDevToolsOpened()) {
    win.webContents.openDevTools({mode: 'detach'})
  }
}

export const setFullScreenPosition = () => {
  const win = remote.getCurrentWindow()
  win.setFullScreen(true)
  // const { width, height, x, y } = remote.screen.getPrimaryDisplay().workArea
  // win.setSize(width, height)
  // win.setPosition(x, y)
}

export const setNewHeight = height => {
  const win = remote.getCurrentWindow()
  const width = win.getSize()[0]
  win.setSize(width, height)
}

export const hideWindow = () => {
  ipcRenderer.send('centrality-hide')
}

export const showWindow = () => {
  ipcRenderer.send('centrality-show')
}

export const reload = () => {
  ipcRenderer.send('centrality-reload')
}

export const setGlobalShortcut = shortcut => {
  return ipcRenderer.send("centrality-register-shortcut", shortcut)
}