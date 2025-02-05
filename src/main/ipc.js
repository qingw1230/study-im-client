import { ipcMain } from 'electron'
import store from './store'
import { initWs } from './wsClient'
import { addUserSetting } from './db/UserSettingModel'
import { selectUserConversationList, delChatConversation, topChatConversation } from './db/ConversationModel'
import { selectMessageList } from './db/ChatLogModel'

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
    addUserSetting(config.userId, config.email)
    callback(config);
    initWs(config, e.sender)
  })
}

const onWinTitleOp = (callback) => {
  ipcMain.on("winTitleOp", (e, data) => {
    callback(e, data)
  })
}

const onSetLocalStore = () => {
  ipcMain.on("setLocalStore", (e, { key, value }) => {
    store.setData(key, value)
  })
}

const onGetLocalStore = () => {
  ipcMain.on("getLocalStore", (e, key) => {
    e.sender.send("getLocalStoreCallback", "这是主进程加的内容：" + store.getData(key))
  })
}

const onLoadConversationData = () => {
  ipcMain.on("loadConversationData", async (e) => {
    const ans = await selectUserConversationList()
    e.sender.send("loadConversationDataCallback", ans)
  })
}

const onTopChatConversation = () => {
  ipcMain.on("topChatConversation", (e, {conversationId, topType}) => {
    topChatConversation(conversationId, topType)
  })
}

const onDelChatConversation = () => {
  ipcMain.on("delChatConversation", (e, conversationId) => {
    delChatConversation(conversationId)
  })
}

const onLoadChatMessage = () => {
  ipcMain.on("loadChatMessage", async (e, data) => {
    const result = await selectMessageList(data)
    e.sender.send("loadChatMessageCallback", result)
  })
}

export {
  onLoginOrRegister,
  onLoginSuccess,
  onWinTitleOp,
  onSetLocalStore,
  onGetLocalStore,
  onLoadConversationData,
  onTopChatConversation,
  onDelChatConversation,
  onLoadChatMessage,
}
