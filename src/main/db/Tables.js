const add_tables = [
  "create table if not exists chat_logs (" +
  "   server_msg_id varchar(64) not null," +
  "   send_id varchar(12) not null," +
  "   recv_id varchar(12) not null," +
  "   conversation_id varchar(24) not null," +
  "   seq bigint not null," +
  "   sender_nick_name varchar(20)," +
  "   sender_face_url varchar(255)," +
  "   session_type integer," +
  "   msg_from integer," +
  "   content_type integer," +
  "   content varchar(3000)," +
  "   send_time bigint," +
  "   create_time bigint," +
  "   status integer," +
  // "   file_size bigint," +
  // "   file_name varchar," +
  // "   file_path varchar," +
  // "   file_type integer," +
  "   primary key(server_msg_id, conversation_id)" +
  ");",
  "create table if not exists conversations (" +
  "   owner_user_id varchar(12) not null," +
  "   conversation_id varchar(24) not null," +
  "   conversation_type integer," +
  "   conversation_name varchar(50)," +
  "   contact_id varchar(12)," +
  "   member_count integer," +
  "   no_read_count integer default 0," +
  "   top_type integer default 0," +
  "   last_message varchar(1024)," +
  "   last_message_time bigint," +
  "   status integer default 1," +
  "   primary key (owner_user_id, conversation_id)" +
  ");",
  "create table if not exists user_settings (" +
  "   user_id varchar(12) not null," +
  "   email varchar(50) not null," +
  "   local_seq bigint not null default 0," + 
  "   contact_no_read integer not null default 0," +
  "   server_port integer," +
  "   primary key (user_id)" +
  ");"
]

const add_index = [
  "create index if not exists idx_conversation_id" +
  " on chat_logs(" +
  "   conversation_id asc" +
  ");"
]

export {
  add_tables,
  add_index,
}
