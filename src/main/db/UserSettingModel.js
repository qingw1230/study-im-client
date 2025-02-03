import { queryCount, queryOne, queryAll, insertOrReplace, update, insertOrIgnore } from "./ADB";
import store from "../store"

const selectUserLocalSeqByUserId = (userId) => {
  let sql = "select * from user_settings where user_id = ?"
  return queryOne(sql, [userId])
}


export {
  selectUserLocalSeqByUserId,
}

