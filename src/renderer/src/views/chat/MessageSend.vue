<template>
  <div class="send-panel">
    <div class="toolbar">
      <el-popover :visible="showEmojiPopover" trigger="click" placement="top" :teleported="false" @show="openPopover"
        @hide="closePopover" :popper-style="{
          padding: '0px 10px 10px 10px',
          width: '490px'
        }">
        <template #default>
          <el-tabs v-model="activeEmoji" @click.stop>
            <el-tab-pane :label="emoji.name" :name="emoji.name" v-for="emoji in emojiList">
              <div class="emoji-list">
                <div class="emoji-item" v-for="item in emoji.emojiList" @click="sendEmoji(item)">
                  {{ item }}
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </template>
        <template #reference>
          <div class="iconfont icon-emoji" @click="showEmojiPopoverHandler"></div>
        </template>
      </el-popover>
      <!-- <el-upload
        ref="uploadRef"
        name="file"
        :show-file-list="false"
        :multiple="true"
        :limit="fileLimit"
        :http-request="uploadFile"
        :on-exceed="uploadExceed"
      ></el-upload> -->
    </div>
    <div class="input-area" @drop="dropHandler" @dragover="dragOverHandler">
      <el-input rows="5" v-model="msgContent" type="textarea" resize="none" maxlength="500" show-word-limit
        spellcheck="false" input-style="background:#f5f5f5;border:none;" @keydown.enter="sendMessage"
        @paste="pasteFile" />
    </div>
    <div class="send-btn-panel">
      <el-popover trigger="click" :visible="showSendMsgPopover" :hide-after="1500" placement="top-end"
        :teleported="false" @show="openPopover" @hide="closePopover" :popper-style="{
          padding: '5px',
          'min-width': '0px',
          width: '120px'
        }">
        <template #default> <span class="empty-msg">不能发送空白信息</span> </template>
        <template #reference>
          <span class="send-btn" @click="sendMessage">发送(S)</span>
        </template>
      </el-popover>
    </div>
  </div>
</template>

<script setup>
import emojiList from '@/utils/Emoji.js'
import { ref, reactive, getCurrentInstance, nextTick, onMounted, onUnmounted } from 'vue'
import { useUserInfoStore } from '@/stores/UserInfoStore'

const { proxy } = getCurrentInstance()
const userInfoStore = useUserInfoStore()

const props = defineProps({
  currentChatConversation: {
    type: Object,
    default: {},
  }
})

const activeEmoji = ref('笑脸')
const msgContent = ref()

const sendEmoji = (emoji) => {
  msgContent.value = msgContent.value + emoji
  showEmojiPopover.value = false
}

const showEmojiPopoverHandler = () => {
  showEmojiPopover.value = true
}

const showEmojiPopover = ref(false)
const showSendMsgPopover = ref(false)

const hidePopover = () => {
  showEmojiPopover.value = false
  showSendMsgPopover.value = false
}

const sendMessage = (e) => {
  // shift+enter 是换行
  if (e.shiftKey && e.keyCode === 13) {
    return
  }
  e.preventDefault()
  
  const messageContent = msgContent.value ? msgContent.value.replace(/\s*$/g, '') : ''
  if (messageContent == "") {
    showSendMsgPopover.value = true
    return
  }

  sendMessageDo(
    {
      content: messageContent,
      contentType: 101,
    },
    true
  )
}

const emit = defineEmits(["sendMessageForLoacl"])

const sendMessageDo = async (messageObj = {
  content,
  contentType,
}, cleanMsgContent) => {
  messageObj.sendId = props.currentChatConversation.ownerUserId
  messageObj.recvId = props.currentChatConversation.contactId
  messageObj.senderNickName = userInfoStore.getInfo().nickName
  messageObj.groupId = props.currentChatConversation.contactId
  messageObj.sessionType = props.currentChatConversation.conversationType
  messageObj.msgFrom = 100
  messageObj.createTime = Date.now()

  let result = await proxy.Request({
    url: proxy.Api.sendMessage,
    showLoading: false,
    params: {
      ...messageObj
    },
    showError: false,
    errorCallback: (responseData) => {
      // TODO(qingw1230): 被拉黑或删除后重新添加
      // TODO(qingw1230): 发送失败后尝试重新发送
    }
  })
  if (!result) {
    return
  }
  if (cleanMsgContent) {
    msgContent.value = ''
  }
  Object.assign(messageObj, result.data)
  emit("sendMessageForLoacl", messageObj)
  window.ipcRenderer.send('addLocalMessage', messageObj)
}

const uploadRef = ref();
const uplodaFile = (file)=>{
  sendMessageDo(file.file)
  uploadRef.value.clearFiles()
}

</script>

<style lang="scss" scoped>
.emoji-list {
  .emoji-item {
    float: left;
    font-size: 23px;
    padding: 2px;
    text-align: center;
    border-radius: 3px;
    margin-left: 10px;
    margin-top: 5px;
    cursor: pointer;

    &:hover {
      background: #ddd;
    }
  }
}

.send-panel {
  height: 200px;
  border-top: 1px solid #ddd;

  .toolbar {
    height: 40px;
    display: flex;
    align-items: center;
    padding-left: 10px;

    .iconfont {
      color: #494949;
      font-size: 20px;
      margin-left: 10px;
      cursor: pointer;
    }

    :deep(.el-tabs__header) {
      margin-bottom: 0px;
    }
  }

  .input-area {
    padding: 0px 10px;
    outline: none;
    width: 100%;
    height: 115px;
    overflow: auto;
    word-wrap: break-word;
    word-break: break-all;

    :deep(.el-textarea__inner) {
      box-shadow: none;
    }

    :deep(.el-input__count) {
      background: none;
      right: 12px;
    }
  }

  .send-btn-panel {
    text-align: right;
    padding-top: 10px;
    margin-right: 22px;

    .send-btn {
      cursor: pointer;
      color: #07c160;
      background: #e9e9e9;
      border-radius: 5px;
      padding: 8px 25px;

      &:hover {
        background: #d2d2d2;
      }
    }

    .empty-msg {
      font-size: 13px;
    }
  }
}
</style>
