import { io } from "socket.io-client";
import { getApiOrigin } from "../config/apiConfig";

const getSocketUrl = () => getApiOrigin();

let socket = null;

export function getSocket() {
  const token = sessionStorage.getItem("token") || "";

  if (!socket) {
    socket = io(getSocketUrl(), {
      autoConnect: false,
      auth: { token },
      transports: ["websocket", "polling"],
    });
  } else {
    socket.auth = { token };
  }

  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
