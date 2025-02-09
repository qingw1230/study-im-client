import { add_tables, add_index } from "./Tables"

const fs = require("fs")
const sqlite3 = require("sqlite3").verbose()
const os = require("os")
const NODE_ENV = process.env.NODE_ENV

const userDir = os.homedir()
const dbFolder = userDir + (NODE_ENV === "development" ? "/.studyimdev/" : "/.studyim/")
if (!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder);
}

const db = new sqlite3.Database(dbFolder + "local.db")

const globalColumnsMap = {}

const createTable = () => {
  return new Promise(async (resolve, reject) => {
    for (const item of add_tables) {
      await db.run(item, [])
    }

    for (const item of add_index) {
      await db.run(item, [])
    }
    resolve();
  })
}

const run = (sql, params) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(sql)
    stmt.run(params, function (err, row) {
      if (err) {
        resolve("操作数据库失败")
      }
      resolve(this.changes)
    })
    stmt.finalize()
  })
}

const insert = (sqlPrefix, tableName, data) => {
  const columnsMap = globalColumnsMap[tableName]
  const dbColumns = []
  const params = []
  for (let item in data) {
    if (data[item] != undefined && columnsMap[item] != undefined) {
      dbColumns.push(columnsMap[item])
      params.push(data[item])
    }
  }

  const preper = "?".repeat(dbColumns.length).split("").join(",")
  const sql = `${sqlPrefix} ${tableName} (${dbColumns.join(",")}) values(${preper})`
  return run(sql, params)
}

const insertOrReplace = (tableName, data) => {
  return insert("insert or replace into", tableName, data)
}

const insertOrIgnore = (tableName, data) => {
  return insert("insert or ignore into", tableName, data)
}

// update 更新表中数据，data 为要更新的数据，paramData 为 where 中的条件
const update = (tableName, data, paramData) => {
  const columnsMap = globalColumnsMap[tableName]
  const dbColumns = []
  const params = []
  const whereColumns = []
  for (let item in data) {
    if (data[item] != undefined && columnsMap[item] != undefined) {
      dbColumns.push(`${columnsMap[item]} = ?`)
      params.push(data[item])
    }
  }

  for (let item in paramData) {
    if (paramData[item]) {
      params.push(paramData[item])
      whereColumns.push(`${columnsMap[item]} = ?`)
    }
  }

  const sql = `update ${tableName} set ${dbColumns.join(",")} ${whereColumns.length > 0 ? 'where ' : ''} ${whereColumns.join(" and ")}`
  console.log(sql)
  return run(sql, params)
}

const queryAll = (sql, params) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(sql)
    stmt.all(params, function (err, row) {
      if (err) {
        resolve([])
      }
      row.forEach((item, index) => {
        row[index] = convertDbObj2BizObj(item)
      })
      resolve(row)
    })
    stmt.finalize()
  })
}

const queryOne = (sql, params) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(sql)
    stmt.get(params, function (err, row) {
      if (err) {
        resolve({})
      }
      resolve(convertDbObj2BizObj(row))
    })
    stmt.finalize()
  })
}

const queryCount = (sql, params) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(sql)
    stmt.get(params, function (err, row) {
      if (err) {
        resolve(0)
      }
      resolve(Array.from(Object.values(row))[0])
    })
    stmt.finalize()
  })
}

const convertDbObj2BizObj = (data) => {
  if (!data) {
    return null
  }
  const bizData = {}
  for (let item in data) {
    bizData[toCamelCase(item)] = data[item]
  }
  return bizData
}

const toCamelCase = (str) => {
  return str.replace(/_([a-z])/g, function (match, p1) {
    return String.fromCharCode(p1.charCodeAt(0) - 32);
  });
}

const initTableColumnsMap = async () => {
  let sql = `select name from sqlite_master where type = 'table' and name != 'sqlite_sequence'`
  let tables = await queryAll(sql, [])
  for (let i = 0; i < tables.length; i++) {
    sql = `PRAGMA table_info(${tables[i].name})`
    let columns = await queryAll(sql, [])
    const columnsMapItem = {}
    for (let j = 0; j < columns.length; j++) {
      columnsMapItem[toCamelCase(columns[j].name)] = columns[j].name
    }
    globalColumnsMap[tables[i].name] = columnsMapItem
  }
}

const init = () => {
  db.serialize(async () => {
    await createTable()
    initTableColumnsMap()
  })
}

init()

export {
  run,
  queryOne,
  queryCount,
  queryAll,
  insertOrReplace,
  insertOrIgnore,
  insert,
  update,
}
