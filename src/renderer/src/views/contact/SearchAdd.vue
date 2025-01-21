<template>
  <div>
    <Dialog :show="dialogConfig.show" :title="dialogConfig.title" :buttons="dialogConfig.buttons" width="400px"
      :showCancel="true" @close="dialogConfig.show = false">
      <el-form :model="searchResult" ref="searchResultRef" @submit.prevent>
        <el-form-item label="" prop="applyInfo">
          <el-input type="textarea" :rows=5 clearable placeholder="请输入申请信息" v-model.trim="searchResult.reqMsg"
            resize="none" show-word-limit maxlength="100"></el-input>
        </el-form-item>
      </el-form>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick } from 'vue'
import { useUserInfoStore } from '@/stores/UserInfoStore'

const { proxy } = getCurrentInstance()
const userInfoStore = useUserInfoStore()

const dialogConfig = ref({
  show: false,
  title: '提交申请',
  buttons: [
    {
      type: 'primary',
      text: '确定',
      click: (e) => {
        submitApply()
      }
    }
  ]
})

const searchResult = ref({})
const searchResultRef = ref()

const emit = defineEmits(['reload'])
const submitApply = async () => {
  let result = await proxy.Request({
    url: proxy.Api.addFriend,
    params: {
      fromUserId: userInfoStore.getInfo().userId,
      toUserId: searchResult.value.userId,
      reqMsg: searchResult.value.reqMsg
    }
  })
  if (!result) {
    return
  }

  // TODO(qingw1230): 无需验证时的逻辑
  proxy.Message.success("申请成功")
  dialogConfig.value.show = false
  emit("reload")
}

const show = (data) => {
  dialogConfig.value.show = true
  nextTick(() => {
    searchResultRef.value.resetFields()
    searchResult.value = Object.assign({}, data)
    searchResult.value.reqMsg = '我是 ' + userInfoStore.getInfo().nickName
  })
}

defineExpose({
  show
})

</script>

<style lang="scss" scoped></style>
