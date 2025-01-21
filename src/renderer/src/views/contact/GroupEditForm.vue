<template>
  <el-form :model="formData" :rules="rules" ref="formDataRef" label-width="80px" @submit.prevent>
    <el-form-item label="群名称" prop="groupName">
      <el-input minlength="2" maxlength="30" clearable placeholder="填写群名称（2-32个字）"
        v-model.trim="formData.groupName"></el-input>
    </el-form-item>
    <el-form-item label="群头像" prop="avatarFile">
      <AvatarUpload v-model="formData.avatarFile" ref="avatarUploadRef" @coverFile="saveCover"></AvatarUpload>
    </el-form-item>
    <el-form-item label="群介绍" prop="groupIntroduce">
      <el-input clearable placeholder="添写群介绍，1-255字" v-model.trim="formData.groupIntroduce" type="textarea" rows="5"
        maxlength="255" :show-word-limit="true" resize="none"></el-input>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submit"> {{ formData.groupId ? '修改群组' : '立即创建' }} </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick, onMounted } from 'vue'
import { useUserInfoStore } from '@/stores/UserInfoStore'
import { useContactStateStore } from '@/stores/ContactStateStore'

const { proxy } = getCurrentInstance()
const userInfoStore = useUserInfoStore()
const contactStateStore = useContactStateStore()

const formData = ref({})
const formDataRef = ref()
const rules = {
  groupName: [{ required: true, message: '请输入群名称' }],
  // avatarFile: [{ required: true, message: '请选择头像' }]
}

const emit = defineEmits(['editBack'])
// submit 创建群聊
const submit = async () => {
  formDataRef.value.validate(async (valid) => {
    if (!valid) {
      return
    }
    let result = await proxy.Request({
      url: proxy.Api.createGroup,
      params: {
        ownerUserId: userInfoStore.getInfo().userId,
        groupName: formData.value.groupName,
        introduction: formData.value.groupIntroduce
      }
    })
    if (!result) {
      return
    }
    if (formData.groupId) {
      proxy.Message.success("群聊修改成功")
      emit("editBack")
    } else {
      proxy.Message.success("群聊创建成功")
    }
    formDataRef.value.resetFileds()
    // 重新加载我的群聊列表
    contactStateStore.setContactReload("MYGROUP")
  })
} 

</script>

<style lang="sass" scoped>
</style>
