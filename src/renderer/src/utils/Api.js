const api = {
  prodDomain: "http://172.23.137.168:10000",
  devDomain: "http://172.23.137.168:10000",
  checkCode: "/account/get_check_code",
  login: "/account/login",
  register: "/account/register",
  getUserInfo: "/account/get_user_info",
  addFriend: "/friend/add_friend",
  deleteFriend: "/friend/delete_friend",
  getFriendList: "/friend/get_friend_list",
  addBlacklist: "/friend/add_blacklist",
  createGroup: "/group/create_group",
  getJoinedGroupList: "/group/get_joined_group_list",
  getGroupInfo: "/group/get_group_info",
  setGroupInfo: "/group/set_group_info"
}

export default api;
