import { run, queryCount, queryOne, queryAll, insertOrReplace, update, insertOrIgnore } from "./ADB";
import store from "../store"

const selectUserLocalSeqByUserId = (userId) => {
  let sql = "select local_seq from user_settings where user_id = ?"
  return queryOne(sql, [userId])
}

const updateUserLocalSeqByUserId = (userId, newestSeq) => {
  let sql = "update user_settings set local_seq = ? where user_id = ?"
  return run(sql, [newestSeq, userId])
}

export {
  selectUserLocalSeqByUserId,
  updateUserLocalSeqByUserId,
}

