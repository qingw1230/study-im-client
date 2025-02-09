import { queryCount, queryOne, queryAll, insertOrReplace, update, insertOrIgnore } from "./ADB";
import store from "../store"
import { updateNoReadCount } from "./ConversationModel";
import { selectUserLocalSeqByUserId, updateUserLocalSeqByUserId } from "./UserSettingModel";

const getPageOffset = (pageNo = 1, totalCount) => {
  const pageSize = 20;
  const pageTotal = Number.parseInt((totalCount + pageSize - 1) / pageSize)
  pageNo = pageNo <= 1 ? 1 : pageNo;
  pageNo = pageNo >= pageTotal ? pageTotal : pageNo;
  return {
    pageTotal,
    offset: (pageNo - 1) * pageSize,
    limit: pageSize
  }
}

// saveChatLog 保存一条聊天记录，不能被外部调用
const saveChatLog = (data) => {
  let userId = store.getUserId()
  let contacdId = data.sessionType == 1 ? data.recvId : data.groupId
  if (userId == data.sendId) {
    data.recvId = contacdId
    data.conversationId = userId + contacdId
  } else {
    data.recvId = userId
    data.conversationId = userId + data.sendId
  }
  return insertOrIgnore("chat_logs", data)
}

const saveChatLogBatch = (chatLogList) => {
  return new Promise(async (resolve, reject) => {
    const chatConversationCountMap = {}
    let { localSeq } = await selectUserLocalSeqByUserId(store.getUserId())
    let maxSeq = localSeq
    for (let i = 0; i < chatLogList.length; i++) {
      if (!chatLogList[i].serverMsgId) {
        continue
      }

      await saveChatLog(chatLogList[i])
      maxSeq = Math.max(maxSeq, chatLogList[i].seq)
      let contacdId = chatLogList[i].sessionType == 1 ? chatLogList[i].recvId : chatLogList[i].groupId
      let noReadCount = chatConversationCountMap[contacdId]
      if (!noReadCount) {
        chatConversationCountMap[contacdId] = 1
      } else {
        chatConversationCountMap[contacdId] = noReadCount + 1
      }
    }

    await updateUserLocalSeqByUserId(store.getUserId(), maxSeq)

    // 更新未读数
    for (let item in chatConversationCountMap) {
      await updateNoReadCount(store.getUserId() + item, chatConversationCountMap[item])
    }
    resolve()
  })
}

const selectMessageList = (query) => {
  return new Promise(async (resolve, reject) => {
    const { conversationId, pageNo, maxMessageId } = query
    let sql = "select count(1) from chat_logs where conversation_id = ?"
    const totalCount = await queryCount(sql, [conversationId])
    const { pageTotal, offset, limit } = getPageOffset(pageNo, totalCount)

    const params = [conversationId]
    sql = "select * from chat_logs where conversation_id = ?"
    if (maxMessageId) {
      sql = sql + " and seq <= ?"
      params.push(maxMessageId)
    }
    sql = sql + " order by seq asc limit ?,?"
    params.push(offset)
    params.push(limit)
    const dataList = await queryAll(sql, params)
    resolve({dataList, pageTotal, pageNo})
  })
}

const getFriendRequestList = (recvId) => {
  return new Promise(async (resolve, reject) => {
    let sql = 'select *, max(seq) from chat_logs where content_type = 1201 and recv_id = ? group by send_id'
    const params = [recvId]
    const friendRequestList = await queryAll(sql, params)
    resolve({dataList: friendRequestList})
  })
}

const updateFriendRequest = (data) => {
  return new Promise(async (resolve, reject) => {
    const {sendId, recvId, seq, status} = data
    const paramData = {
      sendId, 
      recvId,
      seq,
    }
    const updateInfo = {
      status,
    }
    await update("chat_logs", updateInfo, paramData)
    resolve()
  })
}

export {
  saveChatLogBatch,
  selectMessageList,
  getFriendRequestList,
  updateFriendRequest,
}
