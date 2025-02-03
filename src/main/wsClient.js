import WebSocket from "ws"
import store from "./store"

import { createTable } from "./db/ADB"

const NODE_ENV = process.env.NODE_ENV

let ws = null
let wsUrl = null
let sender = null
let needReconnect = null
let maxReconnectTimes = null
let lockReconnect = false
let heartBeatTimer = null
let globalUserId = null

const initWs = (config, _sender) => {
  wsUrl = `${NODE_ENV !== 'development' ? store.getData("prodWsDomain") : store.getData("devWsDomain")}?token=${config.token}&sendId=${config.userId}`
  sender = _sender
  needReconnect = true
  maxReconnectTimes = 5
  globalUserId = config.userId
  createWs()
}

const createWs = () => {
  if (wsUrl == null) {
    return
  }

  // 清除旧定时器
  if (heartBeatTimer) {
    clearInterval(heartBeatTimer)
    heartBeatTimer = null
  }

  ws = new WebSocket(wsUrl)
  ws.onopen = function () {
    pullConversationList()
    console.log("客户端 ws 连接成功")
    maxReconnectTimes = 5
  }

  // 从服务器收到消息的回调函数
  ws.onmessage = function (event) {
    console.log("Received message:", event.data)
    const message = JSON.parse(event.data)
    switch (message.reqIdentifier) {
      case 1004:
        console.log("收到拉取会话列表的响应")
        console.log(base64ToJSON(message.data))
    }
  }

  ws.onclose = function () {
    console.log("关闭客户端 ws 连接，准备重连")
    reconnect()
  }

  ws.onerror = function () {
    console.log("连接失败，准备重连")
    reconnect()
  }

  const reconnect = () => {
    if (!needReconnect) {
      console.log("ws 连接断开，无须重连")
      return
    }
    if (ws != null) {
      ws.close()
    }

    if (lockReconnect) {
      return
    }
    lockReconnect = true

    if (maxReconnectTimes > 0) {
      console.log("准备重连，剩余重连次数 " + maxReconnectTimes)
      maxReconnectTimes--

      setTimeout(() => {
        createWs()
        lockReconnect = false
      }, 1000 * 5)
    } else {
      console.log("连接超时")
    }
  }

  const heartBeatData = {
    reqIdentifier: 1000,
    sendId: globalUserId,
  }
  const jsonHeartBeatData = JSON.stringify(heartBeatData)

  heartBeatTimer = setInterval(() => {
    if (ws != null && ws.readyState === 1) {
      ws.send(jsonHeartBeatData)
    }
  }, 1000 * 50)
}

const closeWs = () => {
  needReconnect = false
  if (heartBeatTimer) {
    clearInterval(heartBeatTimer)
    heartBeatTimer = null
  }
  if (ws) {
    ws.close()
  }
}

// pullConversationList 拉取会话列表信息
function pullConversationList() {
  let toJsonData = {
    "opUserId": globalUserId,
    "fromUserId": globalUserId,
  }
  let req = {
    "reqIdentifier": 1004,
    "sendId": globalUserId,
    "data": jsonToBase64(toJsonData),
  }
  ws.send(JSON.stringify(req))
}

// jsonToBase64 使用 JSON 序列化并编码为 Base64 格式
function jsonToBase64(jsonData) {
  const jsonString = JSON.stringify(jsonData)
  const base64String = btoa(jsonString)
  return base64String
}

// base64ToJSON 使用 Base64 解码并反序列化为 JSON 对象
function base64ToJSON(base64String) {
  const jsonString = Buffer.from(base64String, 'base64').toString('utf8');
  const jsonData = JSON.parse(jsonString);
  return jsonData;
}

export {
  initWs,
  closeWs
}
