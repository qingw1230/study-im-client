import WebSocket from "ws"
import store from "./store"

const NODE_ENV = process.env.NODE_ENV

let ws = null
let wsUrl = null
let sender = null
let needReconnect = null
let maxReconnectTimes = null
let lockReconnect = false
let heartBeatTimer = null

const initWs = (config, _sender) => {
  wsUrl = `${NODE_ENV !== 'development' ? store.getData("prodWsDomain") : store.getData("devWsDomain")}?token=${config.token}&sendId=${config.userId}`
  sender = _sender
  needReconnect = true
  maxReconnectTimes = 5
  createWs(config.userId)
}

const createWs = (userId) => {
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
    console.log("客户端 ws 连接成功")
    maxReconnectTimes = 5
  }

  // 从服务器收到消息的回调函数
  ws.onmessage = function (event) {
    const message = JSON.parse(event.data)
    console.log("Received message:", message)
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
        createWs(userId)
        lockReconnect = false
      }, 5000)
    } else {
      console.log("连接超时")
    }
  }

  const heartBeatData = {
    reqIdentifier: 1000,
    sendId: userId,
  }
  const jsonHeartBeatData = JSON.stringify(heartBeatData)

  heartBeatTimer = setInterval(() => {
    if (ws != null && ws.readyState === 1) {
      ws.send(jsonHeartBeatData)
    }
  }, 5000)
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

export {
  initWs,
  closeWs
}
