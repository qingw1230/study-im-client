import { run, queryCount, queryOne, queryAll, insertOrReplace, update, insertOrIgnore } from "./ADB";
import store from "../store"

const os = require("os")

const userDir = os.homedir()

const selectUserLocalSeqByUserId = (userId) => {
  let sql = "select local_seq from user_settings where user_id = ?"
  return queryOne(sql, [userId])
}

const updateUserLocalSeqByUserId = (userId, newestSeq) => {
  let sql = "update user_settings set local_seq = ? where user_id = ?"
  return run(sql, [newestSeq, userId])
}

const addUserSetting = async (userId, email) => {
  let sql = "select max(server_port) server_port from user_settings"
  let { serverPort } = await queryOne(sql, [])
  if (serverPort == null) {
    serverPort = 12000
  } else {
    serverPort++
  }
  const sysSetting = {
    localFileFolder: userDir + "\\.studyim\fileStorage",
  }

  sql = "select * from user_settings where user_id = ?"
  const userInfo = await queryOne(sql, [userId])

  let localFileFolder = sysSetting.localFileFolder + userId
  if (!userInfo) {
    await insertOrIgnore("user_settings", {
      userId: userId,
      email: email,
      localSeq: 0,
      sysSetting: JSON.stringify(sysSetting),
      contactNoRead: 0,
      serverPort: serverPort,
    })
  }

  store.setUserData("localServerPort", serverPort)
  store.setUserData("localFileFolder", localFileFolder)
}

export {
  selectUserLocalSeqByUserId,
  updateUserLocalSeqByUserId,
  addUserSetting,
}

