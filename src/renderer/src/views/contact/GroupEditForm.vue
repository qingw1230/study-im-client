<template>
  <el-form :model="formData" :rules="rules" ref="formDataRef" label-width="80px" @submit.prevent>
    <el-form-item label="群名称" prop="groupName">
      <el-input minlength="2" maxlength="32" clearable placeholder="填写群名称（2-32个字）"
        v-model.trim="formData.groupName"></el-input>
    </el-form-item>
    <el-form-item label="群头像" prop="avatarFile">
      <AvatarUpload v-model="formData.avatarFile" ref="avatarUploadRef" @coverFile="saveCover"></AvatarUpload>
    </el-form-item>
    <el-form-item label="群介绍" prop="introduction">
      <el-input clearable placeholder="添写群介绍，1-255字" v-model.trim="formData.introduction" type="textarea" rows=5
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
// rules 表单的校验规则
const rules = {
  groupName: [{ required: true, message: '请输入群名称' }],
  // avatarFile: [{ required: true, message: '请选择头像' }]
}

const emit = defineEmits(['editBack'])
// submit 创建群聊或修改群聊信息
const submit = async () => {
  formDataRef.value.validate(async (valid) => {
    if (!valid) {
      return
    }

    if (formData.value.groupId) {
      let result = await proxy.Request({
        url: proxy.Api.setGroupInfo,
        params: {
          groupId: formData.value.groupId,
          groupName: formData.value.groupName,
          introduction: formData.value.introduction
        }
      })
      if (!result) {
        return
      }

      proxy.Message.success("群聊修改成功")
      emit("editBack")
    } else {
      let result = await proxy.Request({
        url: proxy.Api.createGroup,
        params: {
          ownerUserId: userInfoStore.getInfo().userId,
          groupName: formData.value.groupName,
          introduction: formData.value.introduction
        }
      })
      if (!result) {
        return
      }

      proxy.Message.success("群聊创建成功")
    }

    formDataRef.value.resetFields()
    // 重新加载我的群聊列表
    contactStateStore.setContactReload("")
    contactStateStore.setContactReload("MYGROUP")
  })
}

const show = (data) => {
  formDataRef.value.resetFields()
  formData.value = Object.assign({}, data)
  formData.value.avatarFile = data.groupId
}

defineExpose({
  show,
})
</script>

<style lang="sass" scoped>
</style>
