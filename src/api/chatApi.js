// High-level helpers for your WS protocol (chat.longapp.site)
// All functions receive the shared ws client from context.

export function wsRegister(client, user, pass) {
  return client.sendJson({
    action: "onchat",
    data: {
      event: "REGISTER",
      data: { user, pass },
    },
  });
}

export function wsLogin(client, user, pass) {
  return client.sendJson({
    action: "onchat",
    data: {
      event: "LOGIN",
      data: { user, pass },
    },
  });
}

export function wsRelogin(client, user, code) {
  return client.sendJson({
    action: "onchat",
    data: {
      event: "RE_LOGIN",
      data: { user, code },
    },
  });
}

export function wsLogout(client) {
  return client.sendJson({
    action: "onchat",
    data: {
      event: "LOGOUT",
    },
  });
}

export function wsCreateRoom(client, name) {
  return client.sendJson({
    action: "onchat",
    data: {
      event: "CREATE_ROOM",
      data: { name },
    },
  });
}

export function wsJoinRoom(client, name) {
  return client.sendJson({
    action: "onchat",
    data: {
      event: "JOIN_ROOM",
      data: { name },
    },
  });
}

export function wsGetRoomChatMes(client, name, page = 1) {
  return client.sendJson({
    action: "onchat",
    data: {
      event: "GET_ROOM_CHAT_MES",
      data: { name, page },
    },
  });
}

export function wsGetPeopleChatMes(client, name, page = 1) {
  return client.sendJson({
    action: "onchat",
    data: {
      event: "GET_PEOPLE_CHAT_MES",
      data: { name, page },
    },
  });
}

export function wsSendChat(client, { type, to, mes }) {
  // type: 'room' | 'people'
  return client.sendJson({
    action: "onchat",
    data: {
      event: "SEND_CHAT",
      data: { type, to, mes },
    },
  });
}

export function wsCheckUserOnline(client, user) {
  return client.sendJson({
    action: "onchat",
    data: {
      event: "CHECK_USER_ONLINE",
      data: { user },
    },
  });
}

export function wsCheckUserExist(client, user) {
  return client.sendJson({
    action: "onchat",
    data: {
      event: "CHECK_USER_EXIST",
      data: { user },
    },
  });
}

export function wsGetUserList(client) {
  return client.sendJson({
    action: "onchat",
    data: {
      event: "GET_USER_LIST",
    },
  });
}
