import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const API_BASE_URL = process.env.REACT_APP_API_URL;

export const createMultiplayerClient = (gameId, callbacks) => {
  const socket = new SockJS(`${API_BASE_URL}/ws-stomp?gameId=${gameId}`);
  const client = new Client({
    webSocketFactory: () => socket,
    debug: (str) => console.log("🕵️ STOMP:", str),
    onConnect: () => {
      // 🎯 게임 데이터 구독
      client.subscribe(`/topic/game/${gameId}`, (msg) =>
        callbacks.onMessage(JSON.parse(msg.body)),
      );
      // 🎯 채팅 데이터 구독 (주소 분리)
      client.subscribe(`/topic/game/${gameId}/chat`, (msg) =>
        callbacks.onChat(JSON.parse(msg.body)),
      );
      // 🎯 에러 구독
      client.subscribe(`/topic/game/${gameId}/errors`, (msg) =>
        callbacks.onError(JSON.parse(msg.body)),
      );

      if (callbacks.onConnected) callbacks.onConnected();
    },
  });
  client.activate();
  return client;
};
