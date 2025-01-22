import axios from 'axios'
import { ElLoading } from 'element-plus'
import Message from '../utils/Message'
import Api from '../utils/Api'

const contentTypeForm = 'application/x-www-form-urlencoded;charset=UTF-8'
const contentTypeJson = 'application/json'
const responseTypeJson = 'json'
let loading = null

const instance = axios.create({
  withCredentials: true,
  baseURL: (import.meta.env.PROD ? Api.prodDomain : "") + "/api",
  timeout: 5 * 1000,
})

instance.interceptors.request.use(
  (config) => {
    if (config.showLoading) {
      loading = ElLoading.service({
        lock: true,
        text: '加载中......',
        background: 'rgba(0, 0, 0, 0.7)',
      });
    }
    return config;
  },
  (error) => {
    if (error.config.showLoading && loading) {
      loading.close();
    }
    Message.error("请求发送失败");
    return Promise.reject("请求发送失败");
  }
);

instance.interceptors.response.use(
  (response) => {
    const { showLoading, errorCallback, showError = true, responseType } = response.config;
    if (showLoading && loading) {
      loading.close()
    }
    // 服务端返回的 JSON 格式的响应体
    const responseData = response.data;
    if (responseType == "arraybuffer" || responseType == "blob") {
      return responseData;
    }

    if (responseData.code == 200) {
      return responseData;
    } else {
      if (errorCallback) {
        errorCallback(responseData);
      }
      return Promise.reject({ showError: showError, msg: responseData.info });
    }
  },
  (error) => {
    if (error.config.showLoading && loading) {
      loading.close();
    }
    if (error.response.status === 400) {
      return Promise.reject({ showError: true, msg: "请求参数错误" })
    } else {
      return Promise.reject({ showError: true, msg: "网络异常" })
    }
  }
);

const request = (config) => {
  // showLoading 若为 ture，当操作较快屏幕会闪烁，体验不好，需要时手动传入
  const { url, params, dataType, showLoading = false, responseType = responseTypeJson, showError = true } = config;
  let contentType = contentTypeJson;
  const body = JSON.stringify(params);
  const token = localStorage.getItem('token')
  let headers = {
    'Content-Type': contentType,
    "token": token
  }
  return instance.post(url, body, {
    headers: headers,
    showLoading: showLoading,
    errorCallback: config.errorCallback,
    showError: showError,
    responseType: responseType
  }).catch(error => {
    if (error.showError) {
      Message.error(error.msg);
    }
    return null;
  });
}

export default request;
