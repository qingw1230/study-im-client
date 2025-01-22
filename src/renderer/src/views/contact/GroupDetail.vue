<template>
  <ContentPanel>
    <div class="group-info-item">
      <div class="group-title"> 群头像：</div>
      <div class="group-value">
        <Avatar :userId="groupInfo.groupId"></Avatar>
      </div>
      <!-- 头像右侧的更多选项 鼠标点击触发 -->
      <el-dropdown placement="bottom-end" trigger="click">
        <span class="el-dropdown-link">
          <div class="iconfont icon-more"></div>
        </span>
        <template #dropdown>
          <el-dropdown-menu v-if="groupInfo.ownerUserId == userInfoStore.getInfo().userId">
            <el-dropdown-item @click="setGroupInfo"> 修改群信息 </el-dropdown-item>
            <el-dropdown-item @click="dissolutionGroup"> 解散群 </el-dropdown-item>
          </el-dropdown-menu>
          <el-dropdown-menu v-else>
            <el-dropdown-item @click="leaveGroup"> 退出群聊 </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div class="group-info-item">
      <div class="group-title"> 群ID： </div>
      <div class="group-value">{{ groupInfo.groupId }}</div>
    </div>
    <div class="group-info-item">
      <div class="group-title"> 群名称：</div>
      <div class="group-value">{{ groupInfo.groupName }}</div>
    </div>
    <div class="group-info-item">
      <div class="group-title"> 群成员：</div>
      <div class="group-value">{{ groupInfo.memberCount }}</div>
    </div>
    <div class="group-info-item notice">
      <div class="group-title"> 群介绍：</div>
      <div class="group-value">{{ groupInfo.introduction || '-' }}</div>
    </div>
    <div class="group-info-item">
      <div class="group-title"></div>
      <div class="group-value">
        <el-button type="primary" @click="sendMessage"> 发送群消息 </el-button>
      </div>
    </div>
  </ContentPanel>
  <GroupEditDialog ref="groupEditDialogRef" @reloadGroupInfo="getGroupInfo"></GroupEditDialog>
</template>

<script setup>
import GroupEditDialog from './GroupEditDialog.vue'
import { ref, reactive, getCurrentInstance, nextTick, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserInfoStore } from '@/stores/UserInfoStore'
import { useContactStateStore } from '@/stores/ContactStateStore'

const { proxy } = getCurrentInstance()
const route = useRoute()
const router = useRouter()
const userInfoStore = useUserInfoStore()
const contactStateStore = useContactStateStore()

// groupInfo 存储从后端获取的群信息
const groupInfo = ref({})
const groupId = ref()
// getGroupInfo 调用后端接口获取群信息
const getGroupInfo = async () => {
  let result = await proxy.Request({
    url: proxy.Api.getGroupInfo,
    params: {
      groupId: groupId.value
    }
  })
  if (!result) {
    return
  }
  groupInfo.value = result.data
}

const groupEditDialogRef = ref()
const setGroupInfo = async () => {
  groupEditDialogRef.value.show(groupInfo.value)
}

// 当 route.query.contactId 发生变化时触发回调获取群信息
watch(
  () => route.query.contactId,
  (newVal, oldVal) => {
    if (newVal) {
      groupId.value = newVal
      getGroupInfo()
    }
  },
  { immediate: true, deep: true }
)
</script>

<style lang="scss" scoped>
.group-info-item {
  display: flex;
  margin: 15px 0px;
  align-items: center;

  .group-title {
    width: 100px;
    text-align: right;
  }

  .group-value {
    flex: 1;
  }
}

.notice {
  align-items: flex-start;
}
</style>
