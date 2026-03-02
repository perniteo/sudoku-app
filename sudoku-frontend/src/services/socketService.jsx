// src/services/socketService.js
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export const createMultiplayerClient = (gameId, callbacks) => {
  const socket = new SockJS(
    `${import.meta.env.VITE_API_URL}/ws-stomp?gameId=${gameId}`,
  );

  const client = new Client({
    webSocketFactory: () => socket,
    debug: (str) => console.log("🕵️ STOMP:", str),
    onConnect: () => {
      console.log("✅ 소켓 연결 성공:", gameId);

      // 🎯 게임 데이터 구독
      client.subscribe(`/topic/game/${gameId}`, (msg) =>
        callbacks.onMessage(JSON.parse(msg.body)),
      );
      // 🎯 채팅 데이터 구독
      client.subscribe(`/topic/game/${gameId}/chat`, (msg) =>
        callbacks.onChat(JSON.parse(msg.body)),
      );
      // 🎯 에러 구독
      client.subscribe(`/topic/game/${gameId}/errors`, (msg) =>
        callbacks.onError(JSON.parse(msg.body)),
      );

      if (callbacks.onConnected) callbacks.onConnected();
    },
    onStompError: (frame) => {
      console.error("❌ STOMP 에러:", frame);
    },
  });

  client.activate();
  return client;
};
