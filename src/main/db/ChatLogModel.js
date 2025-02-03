import { queryCount, queryOne, queryAll, insertOrReplace, update, insertOrIgnore } from "./ADB";
import store from "../store"
import { updateNoReadCount } from "./ConversationModel";
import { selectUserLocalSeqByUserId, updateUserLocalSeqByUserId } from "./UserSettingModel";

const saveChatLog = (data) => {
  let contacdId = data.sessionType == 1 ? data.recvId : data.groupId
  data.recvId = contacdId
  data.conversationId = store.getUserId() + contacdId
  return insertOrReplace("chat_logs", data)
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

export {
  saveChatLogBatch,
}
