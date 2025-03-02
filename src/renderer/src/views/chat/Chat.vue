<template>
  <Layout>
    <template #left-content>
      <div class="drag-panel drag"></div>
      <div class="chat-session-list">
        <template v-for="item in chatConversationList">
          <ChatConversation :data="item" @click="chatConversationClickHandler(item)"
            @contextmenu.stop="onContextMenu(item, $event)"
            :currentSession="item.conversationId == currentChatConversation.conversationId"></ChatConversation>
        </template>
      </div>
    </template>
    <template #right-content>
      <div class="title-panel drag" v-if="Object.keys(currentChatConversation).length > 0">
        <div class="title">
          <span> {{ currentChatConversation.conversationName }} </span>
          <span v-if="currentChatConversation.conversationType != 1">
            ({{ currentChatConversation.memberCount }})
          </span>
        </div>
      </div>
      <div v-if="currentChatConversation.conversationType != 1" class="iconfont icon-more no-drag"
        @click="showGroupDetail"></div>
      <div class="chat-panel" v-show="Object.keys(currentChatConversation).length > 0">
        <div class="message-panel" id="message-panel">
          <div class="message-item" v-for="(data, index) in messageList" :id="'message' + data.seq">
            <template v-if="data.contentType == 101">
              <ChatMessage :data="data" :currentChatConversation="currentChatConversation"></ChatMessage>
            </template>
          </div>
        </div>
        <MessageSend :currentChatConversation="currentChatConversation"
          @sendMessageForLoacl="sendMessageForLocalHandler">
        </MessageSend>
      </div>
    </template>
  </Layout>
</template>

<script setup>
import MessageSend from './MessageSend.vue'
import ChatMessage from './ChatMessage.vue'
import ContextMenu from '@imengyu/vue3-context-menu'
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import ChatConversation from './ChatConversation.vue'
import { ref, reactive, getCurrentInstance, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserInfoStore } from '@/stores/UserInfoStore'

const { proxy } = getCurrentInstance()
const router = useRouter()
const route = useRoute()
const userInfoStore = useUserInfoStore()

const searchKey = ref()
const search = ref()

const chatConversationList = ref([])

// sortChatConversationList 会话排序
const sortChatConversationList = (dataList) => {
  dataList.sort((a, b) => {
    const topTypeResult = b['topType'] - a['topType']
    if (topTypeResult == 0) {
      return b['lastMessageTime'] - a['lastMessageTime']
    }
    return topTypeResult
  })
}

// delChatConversationList 删除会话
const delChatConversationList = (conversationId) => {
  chatConversationList.value = chatConversationList.value.filter((item) => {
    return item.conversationId !== conversationId
  })
}

// currentChatConversation 当前选中的会话
const currentChatConversation = ref({})
const messageList = ref([])
const messageCountInfo = {
  totalPage: 1,
  pageNo: 0,
  maxMessageId: null,
  noData: false,
}

// chatConversationClickHandler 点击会话
const chatConversationClickHandler = (item) => {
  currentChatConversation.value = Object.assign({}, item)
  messageList.value = []
  // TODO(qingw1230): 未读数的处理

  messageCountInfo.pageNo = 0
  messageCountInfo.totalPage = 1
  messageCountInfo.maxMessageId = null
  messageCountInfo.noData = false

  setConversationSelect(item.conversationId)

  loadChatMessage()
}

const setConversationSelect = (conversationId) => {
  window.ipcRenderer.send("setConversationSelect", conversationId)
}

const loadChatConversion = () => {
  window.ipcRenderer.send("loadConversationData")
}

const onLoadConversationData = () => {
  window.ipcRenderer.on("loadConversationDataCallback", (e, dataList) => {
    sortChatConversationList(dataList)
    chatConversationList.value = dataList
  })
}

const onReceivePushMessage = () => {
  window.ipcRenderer.on("receivePushMessage", (e, data) => {
    sendMessageForLocalHandler(data)
  })
}

// loadChatMessage 加载会话的聊天记录
const loadChatMessage = () => {
  if (messageCountInfo.noData) {
    return
  }

  messageCountInfo.pageNo++
  window.ipcRenderer.send("loadChatMessage", {
    conversationId: currentChatConversation.value.conversationId,
    pageNo: messageCountInfo.pageNo,
    maxMessageId: messageCountInfo.maxMessageId,
  })
}

// onLoadChatMessage 收到主进程从数据库中读到的聊天记录
const onLoadChatMessage = () => {
  window.ipcRenderer.on("loadChatMessageCallback", (e, { dataList, pageTotal, pageNo }) => {
    if (pageNo == pageTotal) {
      messageCountInfo.noData = true
    }
    dataList.sort((a, b) => {
      return a.messageId - b.messageId
    })
    messageList.value = dataList.concat(messageList.value)
    messageCountInfo.pageNo = pageNo
    messageCountInfo.pageTotal = pageTotal
    if (pageNo == 1) {
      messageCountInfo.maxMessageId = dataList.length > 0 ? dataList[dataList.length - 1].seq : null
      gotoBottom()
    }
  })
}

const onReceiveMessage = () => {
  window.ipcRenderer.on("receiveMessage", (e, message) => {
    console.log("收到消息", message)
    switch (message.messageType) {
      case 1000:
        break
      case 1004:
        loadChatConversion()
        break
    }
  })
}

const sendMessageForLocalHandler = (messageObj) => {
  messageList.value.push(messageObj)
  sortChatConversationList(chatConversationList.value)
  gotoBottom()

  let userId = userInfoStore.getInfo().userId
  let contacdId = messageObj.sessionType == 1 ? messageObj.recvId : messageObj.groupId
  if (userId == messageObj.sendId) {
    messageObj.conversationId = userId + contacdId
  } else {
    messageObj.conversationId = userId + messageObj.sendId
  }

  const chatConversation = chatConversationList.value.find((item) => {
    return item.conversationId == messageObj.conversationId 
  })
  if (chatConversation) {
    chatConversation.lastMessage = messageObj.content
    chatConversation.lastMessageTime = messageObj.sendTime
  }
}

const gotoBottom = () => {
  nextTick(() => {
    const items = document.querySelectorAll(".message-item")
    if (items.length > 0) {
      setTimeout(() => {
        items[items.length - 1].scrollIntoView()
      }, 100)
    }
  })
}

onMounted(() => {
  onLoadConversationData()
  onLoadChatMessage()
  onReceiveMessage()
  onReceivePushMessage()

  loadChatConversion()
})

onUnmounted(() => {
  window.ipcRenderer.removeAllListeners("loadConversationDataCallback")
  window.ipcRenderer.removeAllListeners("loadChatMessageCallback")
  window.ipcRenderer.removeAllListeners("receiveMessage")
  window.ipcRenderer.removeAllListeners("receivePushMessage")
})

const setTop = (data) => {
  data.topType = data.topType == 0 ? 1 : 0
  sortChatConversationList(chatConversationList.value)
  window.ipcRenderer.send("topChatConversation", {
    conversationId: data.conversationId,
    topType: data.topType,
  })
}

const delChatConversation = (conversationId) => {
  delChatConversationList(conversationId)
  currentChatConversation.value = {}
  window.ipcRenderer.send("delChatConversation", conversationId)
}

// onContextMenu 右键
const onContextMenu = (data, event) => {
  ContextMenu.showContextMenu({
    x: event.x,
    y: event.y,
    items: [
      {
        label: data.topType == 0 ? "置顶" : "取消置顶",
        onClick: () => {
          setTop(data)
        }
      },
      {
        label: "删除聊天",
        onClick: () => {
          proxy.Confirm({
            message: `确定要从消息列表中移除 ${data.conversationName} 吗？`,
            okfun: () => {
              delChatConversation(data.conversationId)
            },
          })
        }
      },

    ]
  })
}

</script>

<style lang="scss" scoped>
.drag-panel {
  height: 25px;
  background: #f7f7f7;
}

.top-search {
  padding: 0px 10px 9px 10px;
  background: #f7f7f7;
  display: flex;
  align-items: center;

  .iconfont {
    font-size: 12px;
  }
}

.chat-session-list {
  height: calc(100vh - 62px);
  overflow: hidden;
  border-top: 1px solid #ddd;

  &:hover {
    overflow: auto;
  }
}

.search-list {
  height: calc(100vh - 62px);
  background: #f7f7f7;
  overflow: hidden;

  &:hover {
    overflow: auto;
  }
}

.title-panel {
  display: flex;
  align-items: center;

  .title {
    height: 60px;
    line-height: 60px;
    padding-left: 10px;
    font-size: 18px;
    color: #000000;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.icon-more {
  position: absolute;
  z-index: 1;
  top: 30px;
  right: 3px;
  width: 20px;
  font-size: 20px;
  margin-right: 5px;
  cursor: pointer;
}

.chat-panel {
  border-top: 1px solid #ddd;
  background: #f5f5f5;

  .message-panel {
    padding: 10px 30px 0px 30px;
    height: calc(100vh - 200px - 62px);
    overflow-y: auto;

    .message-item {
      margin-bottom: 15px;
      text-align: center;
    }
  }
}
</style>