<template>
  <div class="login-panel">
    <div class="title drag"> StudyIM </div>
    <!-- showLoading 为 true 时就显示加载图 -->
    <div v-if="showLoading" class="loading-panel">
      <img src="../assets/img/loading.gif" />
    </div>
    <div v-else class="login-form">
      <div class="error-msg"> {{ errorMsg }} </div>
      <el-form :model="formData" ref="formDataRef" label-width="0px" @submit.prevent>
        <el-form-item prop="email">
          <el-input size="large" clearable placeholder="请输入邮箱" maxLength="30" v-model.trim="formData.email"
            @focus="cleanVerify">
            <template #prefix>
              <span class="iconfont icon-email"></span>
            </template>
          </el-input>
        </el-form-item>
        <!-- v-if 判断不是登录时才显示 -->
        <el-form-item v-if="!isLogin" prop="nickName">
          <el-input size="large" clearable placeholder="请输入昵称" maxLength="15" v-model.trim="formData.nickName"
            @focus="cleanVerify">
            <template #prefix>
              <span class="iconfont icon-user-nick"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input size="large" show-password placeholder="请输入密码" v-model.trim="formData.password"
            @focus="cleanVerify">
            <template #prefix>
              <span class="iconfont icon-password"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item v-if="!isLogin" prop="rePassword">
          <el-input size="large" show-password placeholder="请再次输入密码" v-model.trim="formData.rePassword"
            @focus="cleanVerify">
            <template #prefix>
              <span class="iconfont icon-password"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="checkCode">
          <div class="check-code-panel">
            <el-input size="large" placeholder="请输入验证码" v-model.trim="formData.checkCode" @focus="cleanVerify">
              <template #prefix>
                <span class="iconfont icon-checkcode"></span>
              </template>
            </el-input>
            <img :src="checkCodeUrl" class="check-code" @click="changeCheckCode" />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" @click="submit"> {{ isLogin ? '登录' : '立即注册' }} </el-button>
        </el-form-item>
        <div class="bottom-link">
          <span class="a-link" @click="changeOpType"> {{ isLogin ? '注册账号' : '账密登录' }} </span>
        </div>
      </el-form>
    </div>
  </div>
  <WinOp :showSetTop="false" :showMin="false" :showMax="false" :closeType="0"></WinOp>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick, onMounted } from "vue"
import { useUserInfoStore } from '@/stores/UserInfoStore'
import { useRouter } from 'vue-router'
import { dataType } from "element-plus/es/components/table-v2/src/common.mjs"

const { proxy } = getCurrentInstance()
const router = useRouter()
const userInfoStore = useUserInfoStore()
const formData = ref({})
const formDataRef = ref()

const isLogin = ref(true)
// changeOpType 切换登录/注册
const changeOpType = () => {
  window.ipcRenderer.send("loginOrRegister", !isLogin.value)
  isLogin.value = !isLogin.value
  nextTick(() => {
    formDataRef.value.resetFields()
    formData.value = {}
    changeCheckCode()
    cleanVerify()
  })
}

const checkCodeUrl = ref(null)
// changeCheckCode 重新获取验证码
const changeCheckCode = async () => {
  let result = await proxy.Request({
    url: proxy.Api.checkCode,
  })
  if (!result) {
    return
  }
  checkCodeUrl.value = result.data.b64s
  localStorage.setItem("checkCodeId", result.data.id)
}
changeCheckCode()

const errorMsg = ref(null)

const checkValue = (type, value, msg) => {
  if (proxy.Utils.isEmpty(value)) {
    errorMsg.value = msg
    return false
  }
  // 使用正则校验邮箱和密码
  if (type && !proxy.Verify[type](value)) {
    errorMsg.value = msg
    return false
  }
  return true
}

// cleanVerify 清空错误消息
const cleanVerify = () => {
  errorMsg.value = null
}

const showLoading = ref(false)
// submit 登录或注册按钮
const submit = async () => {
  cleanVerify()
  if (!checkValue("checkEmail", formData.value.email, "请输入正确的邮箱")) {
    return
  }
  if (!isLogin.value && !checkValue(null, formData.value.nickName, "请输入昵称")) {
    return
  }
  if (!checkValue("checkPassword", formData.value.password, "密码只能是数字、字符和符号长度8~18位")) {
    return
  }
  if (!isLogin.value && formData.value.password != formData.value.rePassword) {
    errorMsg.value = "两次输入的密码不一致"
    return
  }
  if (!checkValue(null, formData.value.checkCode, "请输入正确的验证码")) {
    return
  }

  if (isLogin.value) {
    showLoading.value = true
  }

  // 向 register 或 login 接口发送 POST 请求
  let result = await proxy.Request({
    url: isLogin.value ? proxy.Api.login : proxy.Api.register,
    params: {
      email: formData.value.email,
      password: formData.value.password,
      platformId: 1,
      checkCode: formData.value.checkCode,
      checkCodeId: localStorage.getItem("checkCodeId"),
      nickName: formData.value.nickName,
    },
    showLoading: isLogin.value ? false : true,
    showError: false,
    // 将加载图关闭，重置验证码
    errorCallback: (response) => {
      showLoading.value = false
      changeCheckCode()
      errorMsg.value = response.info
    }
  })
  if (!result) {
    return
  }

  if (isLogin.value) {
    // 保存用户信息
    userInfoStore.setInfo(result.data)
    localStorage.setItem('token', result.data.token)
    localStorage.setItem('userId', result.data.userId)

    router.push('/main')

    const screenWidth = window.screen.width
    const screenHeight = window.screen.height
    window.ipcRenderer.send('openChat', {
      email: formData.value.email,
      token: result.data.token,
      userId: result.data.userId,
      nickName: result.data.nickName,
      admin: result.data.admin,
      screenWidth: screenWidth,
      screenHeight: screenHeight,
    })

  } else {
    proxy.Message.success('注册成功')
    changeOpType()
  }
}

const init = () => {
  window.ipcRenderer.send("setLocalStore", { key: "prodDomain", value: proxy.Api.prodDomain })
  window.ipcRenderer.send("setLocalStore", { key: "devDomain", value: proxy.Api.devDomain })
  window.ipcRenderer.send("setLocalStore", { key: "prodWsDomain", value: proxy.Api.prodWsDomain })
  window.ipcRenderer.send("setLocalStore", { key: "devWsDomain", value: proxy.Api.devWsDomain })
}

onMounted(() => {
  init()
})
</script>

<style lang="scss" scoped>
.email-select {
  width: 250px;
}

.loading-panel {
  height: calc(100vh - 32px);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;

  img {
    width: 300px;
  }
}

.login-panel {
  background: #fff;
  border-radius: 3px;
  border: 1px solid #ddd;

  .title {
    height: 30px;
    padding: 5px 0px 0px 10px;
  }

  .login-form {
    padding: 0px 15px 29px 15px;

    :deep(.el-input__wrapper) {
      box-shadow: none;
      border-radius: none;
    }

    .el-form-item {
      border-bottom: 1px solid #ddd;
    }

    .email-panel {
      align-items: center;
      width: 100%;
      display: flex;

      .input {
        flex: 1;
      }

      .icon-down {
        margin-left: 3px;
        width: 16px;
        cursor: pointer;
        border: none;
      }
    }

    .error-msg {
      line-height: 30px;
      height: 30px;
      color: #fb7373;
    }

    .check-code-panel {
      display: flex;

      .check-code {
        cursor: pointer;
        width: 120px;
        margin-left: 5px;
      }
    }

    .login-btn {
      margin-top: 20px;
      width: 100%;
      background: #07c160;
      height: 36px;
      font-size: 16px;
    }

    .bottom-link {
      text-align: right;
    }
  }
}
</style>
