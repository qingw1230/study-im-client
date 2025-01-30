import { ipcMain } from 'electron'
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

const onWinTitleOp = (callback) => {
  ipcMain.on("winTitleOp", (e, data) => {
    callback(e, data)
  })
}

const onSetLocalStore = () => {
  ipcMain.on("setLocalStore", (e, {key, value}) => {
    store.setData(key, value)
  })
}

const onGetLocalStore = () => {
  ipcMain.on("getLocalStore", (e, key) => {
    console.log("收到渲染进程的获取事件 key:", key)
    e.sender.send("getLocalStoreCallback", "主进程返回的内容：" + store.getData(key))
  })
}

export {
  onLoginOrRegister,
  onLoginSuccess,
  onWinTitleOp,
  onSetLocalStore,
  onGetLocalStore,
}
