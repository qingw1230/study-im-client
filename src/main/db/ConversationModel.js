import { queryCount, queryOne, queryAll, insertOrReplace, update, insertOrIgnore } from "./ADB";
import store from "../store"

const selectUserConversationByConversationId = (conversationId) => {
  let sql = "select * from conversations where conversation_id = ?";
  return queryOne(sql, [conversationId])
}

const addConversation = (conversationInfo) => {
  insertOrIgnore("conversations", conversationInfo)
}

const updateConversation = (conversationInfo) => {
  const paramData = {
    contactId: conversationInfo.contactId
  }
  const updateInfo = Object.assign({}, conversationInfo)
  return update("conversations", updateInfo, paramData)
}

const saveOrUpdateChatLogBatchForInit = (conversationList) => {
  console.log(conversationList)
  return new Promise(async (resolve, reject) => {
    try {
      for (let i = 0; i < conversationList.length; i++) {
        const conversationInfo = conversationList[i];
        conversationInfo.contactId = conversationInfo.conversationType != 1 ? conversationInfo.groupId : conversationInfo.userId;

        let conversationData = await selectUserConversationByConversationId(store.getUserId()+conversationInfo.contactId)
        if (conversationData) {
          await updateConversation(conversationInfo)
        } else {
          await addConversation(conversationInfo)
        }
      }
      resolve()
    } catch(error){
      resolve()
    }
  })
}

export {
  saveOrUpdateChatLogBatchForInit,
}
