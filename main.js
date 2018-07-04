'use strict';
const { app, BrowserWindow, ipcMain, globalShortcut, protocol, shell } = require('electron');
const path = require('path')
const url = require('url')

const { fetchFileIconAsPng } = require('./native/platform-utils');
const SimpleCache = require('simple-lru-cache');

const DEFAULT_SHORTCUT = 'ctrl+space'

let mainWindow;

let dev = false;
if ( process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath) ) {
  dev = true;
}

const settings = {
  width: 700,
  height: 350,
  frame: false,
  resizable: false,
  skipTaskbar: true,
  closable: false,
  minimizable: false,
  title: "Centrality",
  transparent: true,
  backgroundColor: '#00000000',
  show: false
}

function createWindow() {
  mainWindow = new BrowserWindow(settings);
  mainWindow.setMenu(null)

  let indexPath;
  if ( dev && process.argv.indexOf('--noDevServer') === -1 ) {
    indexPath = url.format({
      protocol: 'http:',
      host: 'localhost:8080',
      pathname: 'index.html',
      slashes: true,
      title: 'BitCentrality'
    });
  } else {
    indexPath = url.format({
      protocol: 'file:',
      pathname: path.join(__dirname, 'dist', 'index.html'),
      slashes: true
    });
  }
  mainWindow.loadURL( indexPath );

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if ( dev ) {
      mainWindow.webContents.openDevTools({mode: 'detach'});
    }
  });

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
  mainWindow.on('blur', () => mainWindow.hide());
  mainWindow.webContents.on('new-window', handleRedirect);
  mainWindow.webContents.on('will-navigate', handleRedirect);
}

function handleRedirect(event, url) {
  event.preventDefault()
  shell.openExternal(url)
}

ipcMain.on('centrality-register-shortcut', (event, shortcut) => {
  try {
    setGlobalShortcut(shortcut)
  } catch (e) {
    console.log(e)
    setGlobalShortcut(DEFAULT_SHORTCUT)
  }
})

ipcMain.on('centrality-reload', (event, args) => {
  mainWindow.reload()
  mainWindow.setSize(700, 350)
  mainWindow.center()
  const x = mainWindow.getPosition()[0]
  mainWindow.setPosition(x, 100)
})

ipcMain.on('centrality-hide', (event, args) => {
  hide()
})

ipcMain.on('centrality-show', (event, args) => {
  mainWindow.show()
})

function setGlobalShortcut(shortcut) {
  globalShortcut.register(shortcut, () => {
    if (mainWindow.isVisible()) {
      hide()
    } else {
      mainWindow.show()
    }
  })
}

function hide() {
  mainWindow.blur()
  mainWindow.hide()
}

app.on('ready', () => {
  createWindow()
  const x = mainWindow.getPosition()[0]
  mainWindow.setPosition(x, 100)
  mainWindow.setTitle('Centrality')
  register()
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});


function register() {
  const cache = new SimpleCache({ maxSize: 100 });

  protocol.registerBufferProtocol('icon', (req, callback) => {
    let filePath = null;
    try {
      const path_base64 = req.url.substr(7);
      filePath = new Buffer(path_base64, 'base64').toString();
    } catch (e) {
      return callback();
    }

    if (filePath === null || filePath.length === 0) {
      return callback();
    }

    let cacheKey = filePath;
    const extName = path.extname(filePath).toLowerCase();

    if (extName.length > 0 && extName !== '.exe' && extName !== '.lnk' && extName !== '.appref-ms') {
      cacheKey = extName;
    } else {
      cacheKey = filePath;
    }

    const buffer = cache.get(cacheKey);
    if (buffer === undefined) {
      fetchFileIconAsPng(filePath, (err, buf) => {
        if (err || buf === null) {
          console.log(`internal error ${err}`);
          return callback();
        }
        cache.set(cacheKey, buf);
        callback({ mimeType: 'image/png', data: buf });
      });
    } else {
      callback({ mimeType: 'image/png', data: buffer });
    }
  }, (err) => {
    if (err) {
      console.log('failed to register protocol: icon');
    }
  });
}