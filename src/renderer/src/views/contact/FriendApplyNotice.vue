<template>
  <ContentPanel v-infinite-scroll="loadFriendRequest" :infinite-scroll-immediate="false" :showTopBorder="true">
    <div class="apply-item" v-for="item in friendReqiestList" :key="item.sendId">
      <Avatar :width="50" :userId="item.sendId"></Avatar>
      <div class="contact-info">
        <div class="nick-name">{{ item.senderNickName }}</div>
        <div class="apply-info">{{ item.content }}</div>
      </div>
      <div class="op-btn">
        <div v-if="item.status == null">
          <el-dropdown placement="bottom" trigger="click">
            <span class="el-dropdown-link">
              <el-button type="primary" size="small">接受</el-button>
            </span>
            <template #dropdown>
              <el-dropdown-item @click="addFriendResponse(item.sendId, item.recvId, item.seq, 1)"> 同意 </el-dropdown-item>
              <el-dropdown-item @click="addFriendResponse(item.sendId, item.recvId, item.seq, -1)"> 拒绝 </el-dropdown-item>
            </template>
          </el-dropdown>
        </div>
        <div v-else-if="item.status === 1" class="result-name"> 已同意 </div>
        <div v-else-if="item.status === -1" class="result-name"> 已拒绝 </div>
        <div v-else class="result-name"> 其他状态 </div>
      </div>
    </div>
    <div v-if="friendReqiestList.length == 0" class="no-data"> 暂无通知 </div>
  </ContentPanel>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useContactStateStore } from '@/stores/ContactStateStore'
import { useUserInfoStore } from '@/stores/UserInfoStore'

const { proxy } = getCurrentInstance()
const contactStateStore = useContactStateStore()
const userInfoStore = useUserInfoStore()

const friendReqiestList = ref([])

const addFriendResponse = async (sendId, recvId, seq, handleResult) => {
  contactStateStore.setContactReload(null)
  let result = await proxy.Request({
    url: proxy.Api.addFriendResponse,
    params: {
      fromUserId: sendId,
      toUserId: recvId,
      handleResult: handleResult,
    }
  })
  if (!result) {
    return
  }

  updateFriendRequest(sendId, recvId, seq, handleResult)

  if (handleResult == 1) {
    contactStateStore.setContactReload("FRIEND_LIST")
  }
}

// updateFriendRequest 更新好友请求列表
const updateFriendRequest = (sendId, recvId, seq, handleResult) => {
  window.ipcRenderer.send("updateFriendRequest", {
    sendId: sendId,
    recvId: recvId,
    seq: seq,
    status: handleResult,
  })
}

// loadFriendRequest 加载好友请求列表
const loadFriendRequest = () => {
  window.ipcRenderer.send("loadFriendRequest")
}

const onLoadFriendRequest = () => {
  window.ipcRenderer.on("loadFriendRequestCallback", (e, dataList) => {
    friendReqiestList.value = dataList.dataList
  })
}

const onPushFriendRequest = () => {
  window.ipcRenderer.on("pushFriendRequest", (e) => {
    loadFriendRequest()
  })
}

onMounted(() => {
  onLoadFriendRequest()
  onPushFriendRequest()

  loadFriendRequest()
})

onUnmounted(() => {
  window.ipcRenderer.removeAllListeners("loadFriendRequestCallback")
  window.ipcRenderer.removeAllListeners("pushFriendRequest")
})

// TODO(qingw1230): 监听消息数

</script>

<style lang="scss" scoped>
.apply-item {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #ddd;
  padding: 10px 0px;

  .contact-type {
    display: flex;
    justify-content: center;
    writing-mode: vertical-rl;
    vertical-align: middle;
    background: #2cb6fe;
    color: #fff;
    border-radius: 5px 0px 0px 5px;
    height: 50px;
  }

  .user-contact {
    background: #08bf61;
  }

  .contact-info {
    width: 260px;
    margin-left: 10px;

    .nick-name {
      color: #000000;
    }

    .apply-info {
      color: #999999;
      font-size: 12px;
      margin-top: 5px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .op-btn {
    width: 50px;
    text-align: center;

    .result-name {
      color: #999999;
      font-size: 12px;
    }
  }
}
</style>
