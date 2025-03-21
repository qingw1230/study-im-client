import { app, shell, BrowserWindow, Menu, Tray } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { onLoginOrRegister, onLoginSuccess, onWinTitleOp, onSetLocalStore, onGetLocalStore, onLoadConversationData, onDelChatConversation, onTopChatConversation, onLoadChatMessage, onAddLocalMessage, onSetConversationSelect, onLoadFriendRequestList, onUpdateFriendRequest } from './ipc'

const NODE_ENV = process.env.NODE_ENV
const login_width = 300;
const login_height = 370;
const register_height = 490;

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    icon: icon,
    width: login_width,
    height: login_height,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    resizable: false,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: false,
    }
  })

  // 打开控制台
  if (NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.setTitle("StudyIM")
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 托盘
  const tray = new Tray(icon)
  const contextMenu = [
    {
      label: "退出 StydyIM",
      click: function () {
        app.exit()
      }
    }
  ]

  const menu = Menu.buildFromTemplate(contextMenu)
  tray.setToolTip("StudyIM")
  tray.setContextMenu(menu)
  tray.on("click", () => {
    mainWindow.setSkipTaskbar(false)
    mainWindow.show()
  })

  // 监听登录注册
  onLoginOrRegister((isLogin) => {
    mainWindow.setResizable(true)
    if (isLogin) {
      mainWindow.setSize(login_width, login_height)
    } else {
      mainWindow.setSize(login_width, register_height)
    }
    mainWindow.setResizable(false)
  })

  onLoginSuccess((config) => {
    mainWindow.setResizable(true)
    mainWindow.setSize(850, 800)
    mainWindow.center()
    // 设置最大最小窗口大小
    mainWindow.setMaximizable(true)
    mainWindow.setMinimumSize(800, 600)
    contextMenu.unshift({
      label: "用户: " + config.nickName,
      click: function () {
      }
    })
    tray.setContextMenu(Menu.buildFromTemplate(contextMenu))
    // TODO(qingw1230): 管理后台的窗口
  })

  onWinTitleOp((e, { action, data }) => {
    const webContents = e.sender
    const win = BrowserWindow.fromWebContents(webContents)
    switch (action) {
      case "close": {
        if (data.closeType == 0) {
          win.close();
        } else {
          win.setSkipTaskbar(true) // 使窗口不显示在任务栏中
          win.hide()
        }
        break;
      }
      case "minimize": {
        win.minimize();
        break;
      }
      case "maximize": {
        win.maximize();
        break;
      }
      case "unmaximize": {
        win.unmaximize();
        break;
      }
      case "top": {
        win.setAlwaysOnTop(data.top);
      }
    }
  })

  onSetLocalStore()
  onGetLocalStore()
  onLoadConversationData()
  onTopChatConversation()
  onDelChatConversation()
  onLoadChatMessage()
  onSetConversationSelect()
  onAddLocalMessage()
  onLoadFriendRequestList()
  onUpdateFriendRequest()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
