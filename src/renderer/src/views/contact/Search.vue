<template>
  <ContentPanel>
    <div class="search-form">
      <el-input clearable placeholder="请输入用户ID" v-model="contactId" size="large" @keydown.enter="search"></el-input>
      <div class="search-btn iconfont icon-search" @click="search"></div>
    </div>
    <div v-if="searchResult && Object.keys(searchResult).length > 0" class="search-result-panel">
      <div class="search-result">
        <span class="contact-type"> {{ contactTypeName }} </span>
        <UserBaseInfo :userInfo="searchResult" :showArea="true"></UserBaseInfo> 
      </div>
      <div class="op-btn" v-if="searchResult.userId != userInfoStore.getInfo().userId">
        <el-button type="primary" v-if="searchResult.status == null ||
          searchResult.status == -1" @click="applyContact">
          {{ "添加到联系人" }} </el-button>
        <el-button type="primary" v-if="searchResult.status == 1" @click="sendMessage"> 发消息 </el-button>
      </div>
    </div>
    <div v-else class="no-data"> 没有搜索到任何结果 </div>
  </ContentPanel>
  <SearchAdd ref="searchAddRef" @reload="resetForm"></SearchAdd>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick, computed } from 'vue'
import { useUserInfoStore } from '@/stores/UserInfoStore'
import SearchAdd from './SearchAdd.vue'

const { proxy } = getCurrentInstance()
const userInfoStore = useUserInfoStore()

// contactTypeName 联系人类型: 自己 用户
const contactTypeName = computed(() => {
  if (userInfoStore.getInfo().userId === searchResult.value.userId) {
    return '自己'
  } else {
    return '用户'
  }
})

const contactId = ref()
const searchResult = ref({})
const search = async () => {
  let result = await proxy.Request({
    url: proxy.Api.getUserInfo,
    params: {
      userId: contactId.value
    }
  })
  if (!result) {
    return
  }
  searchResult.value = result.data
}

const searchAddRef = ref()
const applyContact = () => {
  searchAddRef.value.show(searchResult.value)
}
</script>

<style lang="scss" scoped>
.search-form {
  padding-top: 50px;
  display: flex;
  align-items: center;

  :deep(.el-input__wrapper) {
    border-radius: 4px 0px 0px 4px;
    border-right: none;
  }

  .search-btn {
    background: #07c160;
    color: #fff;
    line-height: 40px;
    width: 80px;
    text-align: center;
    border-radius: 0px 5px 5px 0px;
    cursor: pointer;

    &:hover {
      background: #0dd36c;
    }
  }
}

.no-data {
  padding: 30px 0px;
}

.search-result-panel {
  .search-result {
    padding: 30px 20px 20px 20px;
    background: #fff;
    border-radius: 5px;
    margin-top: 10px;
    position: relative;

    .contact-type {
      position: absolute;
      left: 0px;
      top: 0px;
      background: #2cb6fe;
      padding: 2px 5px;
      color: #fff;
      border-radius: 5px 0px 0px 0px;
      font-size: 12px;
    }
  }

  .op-btn {
    border-radius: 5px;
    margin-top: 10px;
    padding: 10px;
    background: #fff;
    text-align: center;
  }
}
</style>
