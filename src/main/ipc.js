import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
const NODE_ENV = process.env.NODE_ENV
import store from './store'

const onLoginOrRegister = (callback) => {
  ipcMain.on("loginOrRegister", (e, isLogin) => {
    callback(isLogin)
  })
}

// 登录成功
const onLoginSuccess = (callback) => {
  ipcMain.on("openChat", async (e, config) => {
    store.initUserId(config.userId)
    store.setUserData("token", config.token)
    callback(config);

    // TODO(qingw1230): 初始化 ws 连接
  })
}

export {
  onLoginOrRegister,
  onLoginSuccess,
}
