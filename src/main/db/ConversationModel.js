import { run, queryCount, queryOne, queryAll, insertOrReplace, update, insertOrIgnore } from "./ADB";
import store from "../store"

const addConversation = (conversationInfo) => {
  insertOrIgnore("conversations", conversationInfo)
}

const updateConversationInfoForMessage = async (currentConversationId, {conversationId, conversationName, lastMessage, lastMessageTime, memberCount}) => {
  const params = [lastMessage, lastMessageTime]
  let sql = "update conversations set last_message = ?, last_message_time = ?, status = 1"
  if (conversationName != null) {
    sql = sql + ", conversation_name"
    params.push(conversationName)
  }
  if (memberCount != null) {
    sql = sql + ", member_count = ?"
    params.push(memberCount)
  }
  if (currentConversationId !== conversationId) {
    sql = sql + ", no_read_count = no_read_count+1"
  }
  sql = sql + " where conversation_id = ?"
  params.push(conversationId)
  return run(sql, params)
}

const updateConversation = (conversationInfo) => {
  const paramData = {
    contactId: conversationInfo.contactId
  }
  const updateInfo = Object.assign({}, conversationInfo)
  return update("conversations", updateInfo, paramData)
}

const saveOrUpdateConversationBatchForInit = (conversationList) => {
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

// updateNoReadCount 更新未读数
const updateNoReadCount = (conversationId, noReadCount) => {
  let sql = "update conversations set no_read_count = no_read_count + ? where conversation_id = ?"
  return run(sql, [noReadCount, conversationId])
}

const selectUserConversationList = () => {
  let sql = "select * from conversations where owner_user_id = ? and status = 1"
  return queryAll(sql, [store.getUserId()])
}

const selectUserConversationByConversationId = (conversationId) => {
  let sql = "select * from conversations where conversation_id = ?"
  return queryOne(sql, [conversationId])
}

const topChatConversation = (conversationId, topType) => {
  const paramData = {
    conversationId,
  }
  const conversationInfo = {
    topType,
  }
  return update("conversations", conversationInfo, paramData)
}

const delChatConversation = (conversationId) => {
  const paramData = {
    conversationId,
  }
  const conversationInfo = {
    status: 0,
  }
  return update("conversations", conversationInfo, paramData)
}

const readAll = (conversationId) => {
  let sql = "update conversations set no_read_count = 0 where conversation_id = ?"
  return run(sql, [conversationId])
}

export {
  saveOrUpdateConversationBatchForInit,
  updateNoReadCount,
  selectUserConversationList,
  topChatConversation,
  delChatConversation,
  updateConversationInfoForMessage,
  readAll,
}
