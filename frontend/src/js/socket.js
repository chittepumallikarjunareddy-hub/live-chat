export function createSocket() {
  return io();
}

export function createSocketClient() {
  return io();
}

export function initSocket(username, token) {
  const socket = io({ auth: { token: token || "" } });
  socket.emit("user:join", { username });
  return socket;
}
