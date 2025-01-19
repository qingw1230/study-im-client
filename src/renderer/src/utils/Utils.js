const isEmpty = (str) => {
  if (str == null || str == "" || str == undefined) {
    return true
  }
  return false
}

// getAreaInfo 将逗号替换为空格
const getAreaInfo = (data) => {
  if (isEmpty(data)) {
    return "-";
  }
  return data.replace(",", " ");
}

export default {
  isEmpty,
  getAreaInfo,
}
