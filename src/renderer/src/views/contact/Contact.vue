<template>
  <Layout>
    <template #left-content>
      <div class="drag-panel drag"></div>
      <div class="top-search">
        <el-input clearable placeholder="搜索" v-model="searchKey" size="default" @keyup="search">
          <template #suffix>
            <span class="iconfont icon-search"></span>
          </template>
        </el-input>
      </div>
      <div class="contact-list">
        <template v-for="item in partList">
          <div class="part-title">{{ item.partName }}</div>
          <div class="part-list">
            <div :class="['part-item', sub.path == route.path ? 'active' : '']" v-for="sub in item.children"
              @click="partJump(sub)">
              <div :class="['iconfont', sub.icon]" :style="{ background: sub.iconBgColor }"></div>
              <div class="text">{{ sub.name }}</div>
            </div>
            <!-- 好友列表返回格式不同，特殊处理 -->
            <template v-if="item.partName == '我的好友'">
              <template v-for="contact in item.contactData">
                <div
                  :class="['part-item', contact[item.contactInfo][item.contactId] == route.query.contactId ? 'active' : '']"
                  @click="contactDetail(contact, item)">
                  <Avatar :userId="contact[item.contactInfo][item.contactId]" :width="35"></Avatar>
                  <div class="text"> {{ contact[item.contactInfo][item.contactName] }} </div>
                </div>
              </template>
            </template>
            <template v-else>
              <template v-for="contact in item.contactData">
                <div :class="['part-item', contact[item.contactId] == route.query.contactId ? 'active' : '']"
                  @click="contactDetail(contact, item)">
                  <Avatar :userId="contact[item.contactId]" :width="35"></Avatar>
                  <div class="text"> {{ contact[item.contactName] }} </div>
                </div>
              </template>
            </template>
            <template v-if="item.contactData && item.contactData.length == 0">
              <div class="no-data"> {{ item.emptyMsg }} </div>
            </template>
          </div>
        </template>
      </div>
    </template>
    <template #right-content>
      <div class="title-panel drag"> {{ rightTitle }} </div>
      <router-view v-slot="{ Component }">
        <component :is="Component" ref="componentRef"></component>
      </router-view>
    </template>
  </Layout>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useContactStateStore } from '@/stores/ContactStateStore'
import { useUserInfoStore } from '@/stores/UserInfoStore'

const { proxy } = getCurrentInstance()
const router = useRouter()
const route = useRoute()
const contactStateStore = useContactStateStore()
const userInfoStore = useUserInfoStore()

const searchKey = ref()
const search = () => { }

const partList = ref([
  {
    partName: '新朋友',
    children: [
      {
        name: '添加朋友',
        icon: 'icon-search',
        iconBgColor: '#fa9d3b',
        path: '/contact/search'
      },
      {
        name: '新的朋友',
        icon: 'icon-plane',
        iconBgColor: '#08bf61',
        path: '/contact/friendApplyNotice',
        showTitle: true,
        countKey: 'contactApplyCount'
      },
      {
        name: '群聊通知',
        icon: 'icon-plane',
        iconBgColor: '#3da3fd',
        path: '/contact/groupApplyNotice',
        showTitle: true,
        countKey: 'contactApplyCount'
      }
    ]
  },
  {
    partName: '我的群聊',
    children: [
      {
        name: '创建群聊',
        icon: 'icon-add-group',
        iconBgColor: '#1485ee',
        path: '/contact/createGroup'
      }
    ],
    contactId: 'groupId',
    contactName: 'groupName',
    showTitle: true,
    contactData: [],
    contactPath: '/contact/groupDetail'
  },
  {
    partName: '我加入的群聊',
    contactId: 'groupId',
    contactName: 'groupName',
    showTitle: true,
    contactData: [],
    contactPath: '/contact/groupDetail',
    emptyMsg: '暂未加入群聊'
  },
  {
    partName: '我的好友',
    children: [],
    contactInfo: 'friendInfo',
    contactId: 'userId',
    contactName: 'nickName',
    contactData: [],
    contactPath: '/contact/userDetail',
    emptyMsg: '暂无好友'
  }
])

const rightTitle = ref()

const partJump = (data) => {
  if (data.showTitle) {
    rightTitle.value = data.name
  } else {
    rightTitle.value = null
  }
  router.push(data.path)
}

// loadFriendList 获取好友列表
const loadFriendList = async () => {
  let result = await proxy.Request({
    url: proxy.Api.getFriendList,
    params: {
      userId: userInfoStore.getInfo().userId,
      pagination: {
        pageNumber: 1,
        showNumber: 100,
      }
    }
  })
  if (!result) {
    return
  }
  // TODO(qingw1230): 添加群 选项加入后更改下标
  partList.value[3].contactData = result.data
}

loadFriendList()

// loadMyGroup 获取创建的群聊
const loadMyGroup = async () => {
  let result = await proxy.Request({
    url: proxy.Api.getJoinedGroupList,
    params: {
      fromUserId: userInfoStore.getInfo().userId,
      roleLevel: 2
    },
    showLoading: false,
  })
  if (!result) {
    return
  }
  partList.value[1].contactData = result.data
}

// loadMyGroup()

// loadJoinedGroup 获取创建的群聊
const loadJoinedGroup = async () => {
  let result = await proxy.Request({
    url: proxy.Api.getJoinedGroupList,
    params: {
      fromUserId: userInfoStore.getInfo().userId,
      roleLevel: 1
    },
    showLoading: false,
  })
  if (!result) {
    return
  }
  partList.value[2].contactData = result.data
}

// loadJoinedGroup()

// contactDetail 获取联系人或群聊详细信息
const contactDetail = (contact, part) => {
  if (part.showTitle) {
    rightTitle.value = contact[part.contactName]
  } else {
    rightTitle.value = null
  }

  let userId
  if (part.partName == '我的好友') {
    userId = contact[part.contactInfo][part.contactId]
  } else {
    userId = contact[part.contactId]
  }

  router.push({
    path: part.contactPath,
    query: {
      contactId: userId
    }
  })
}

watch(
  () => contactStateStore.contactReload,
  (newVal, oldVal) => {
    if (!newVal) {
      return
    }
    switch (newVal) {
      case "FRIEND_LIST":
        loadFriendList()
        break
      case "DELETE_FRIEND":
        loadFriendList()
        router.push('/contact/blank')
        rightTitle.value = null
        break
      case "MYGROUP":
        loadMyGroup()
        break
      case "QUIT_GROUP":
        loadJoinedGroup()
        router.push('/contact/blank')
        rightTitle.value = null
        break
      case "DELETE_GROUP":
        loadMyGroup()
        router.push('/contact/blank')
        rightTitle.value = null
        break
      default:
        break
    }
  },
  { immediate: true, deep: true }
)

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

.contact-list {
  border-top: 1px solid #ddd;
  height: calc(100vh - 62px);
  overflow: hidden;

  &:hover {
    overflow: auto;
  }

  .part-title {
    color: #515151;
    padding-left: 10px;
    margin-top: 10px;
  }

  .part-list {
    border-bottom: 1px solid #d6d6d6;

    .part-item {
      display: flex;
      align-items: center;
      padding: 10px 10px;
      position: relative;

      &:hover {
        cursor: pointer;
        background: #d6d6d7;
      }

      .iconfont {
        width: 35px;
        height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: #fff;
      }

      .text {
        flex: 1;
        color: #000000;
        margin-left: 10px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .no-data {
      text-align: center;
      font-size: 12px;
      color: #9d9d9d;
      line-height: 30px;
    }

    .active {
      background: #c4c4c4;

      &:hover {
        background: #c4c4c4;
      }
    }
  }
}

.title-panel {
  width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
  padding-left: 10px;
  font-size: 18px;
  color: #000000;
}
</style>
