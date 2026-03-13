import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import WaitingRoom from "../components/WaitingRoom";
import api from "../api";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

function WaitingRoomPage({ myId, token, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomCode: urlRoomCode } = useParams();

  // 1. 상태 정의 (location.state 우선 활용)
  const [roomInfo, setRoomInfo] = useState(location.state || null);
  const [chatMessages, setChatMessages] = useState([]);

  const stompClientRef = useRef(null);
  const isConnecting = useRef(false);
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

  // 🎯 2. 멀티플레이 소켓 연결 함수 (보강됨)
  const connectMultiplayer = useCallback(
    (gId, rCode) => {
      // 이미 활성화된 소켓이 있다면 중단
      if (stompClientRef.current?.active) {
        console.log("⚠️ 이미 활성화된 소켓이 있어 연결을 건너뜁니다.");
        return;
      }

      // 기존에 inactive된 소켓이 있다면 확실히 제거
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }

      const socket = new SockJS(
        `${API_BASE_URL}/ws-stomp?gameId=${gId}&roomCode=${rCode}&userId=${myId}`,
      );

      const client = new Client({
        webSocketFactory: () => socket,
        debug: (str) => console.log("🚀 STOMP:", str),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log(`✅ 대기실 연결 성공 (Room: ${rCode})`);
          isConnecting.current = false; // 연결 성공 시에만 해제

          client.subscribe(`/topic/game/${gId}`, (msg) => {
            const data = JSON.parse(msg.body);
            if (data.status === "PLAYING") navigate(`/game/${gId}`);
          });

          client.subscribe(`/topic/game/${gId}/chat`, (msg) => {
            setChatMessages((prev) => [...prev, JSON.parse(msg.body)]);
          });

          client.subscribe(`/topic/game/${gId}/settings`, (msg) => {
            const settings = JSON.parse(msg.body);
            setRoomInfo((prev) => ({
              ...prev,
              difficulty: settings.difficulty,
            }));
          });

          client.subscribe(`/topic/game/${gId}/errors`, (msg) => {
            alert("❌ 에러: " + JSON.parse(msg.body).message);
          });
        },
        onStompError: (frame) => {
          isConnecting.current = false;
          console.error("❌ STOMP 에러:", frame);
        },
        onDisconnect: () => {
          isConnecting.current = false;
          console.log("🔌 소켓 연결 종료");
        },
      });

      client.activate();
      stompClientRef.current = client;
    },
    [myId, navigate, API_BASE_URL],
  );

  // 🎯 3. 데이터 로드 및 소켓 기동 통합 로직 (핵심 수정!)
  useEffect(() => {
    const initRoom = async () => {
      // 💡 핵심: 함수 실행되자마자 즉시 flag 체크 및 설정
      if (isConnecting.current) return;

      // Case 1: 이미 데이터가 있는 경우 (Home에서 이동)
      if (roomInfo?.gameId && roomInfo?.roomCode) {
        isConnecting.current = true; // 소켓 연결 시도 전 즉시 점유
        connectMultiplayer(roomInfo.gameId, roomInfo.roomCode);
        return;
      }

      // Case 2: 새로고침 등으로 데이터가 없는 경우
      if (!urlRoomCode) return;

      try {
        isConnecting.current = true; // API 요청 시작 전 즉시 점유
        const res = await api.get(
          `/rooms/join/${urlRoomCode.toUpperCase()}?userId=${myId}`,
        );
        const data = { ...res.data, roomCode: urlRoomCode.toUpperCase() };
        setRoomInfo(data);

        // 여기서 isConnecting을 false로 풀지 않고 바로 소켓 함수로 넘김
        connectMultiplayer(data.gameId, data.roomCode);
      } catch (err) {
        isConnecting.current = false; // 에러 시에만 풀어줌
        console.error("입장 실패:", err);
        navigate("/");
      }
    };

    if (myId) initRoom();

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
      isConnecting.current = false;
    };
  }, [myId, urlRoomCode, connectMultiplayer, navigate]);
  // 💡 의존성 배열에서 roomInfo를 반드시 제거하세요!

  // 🎯 4. 메시지 전송 핸들러
  const sendChat = (content) => {
    if (!stompClientRef.current?.connected) return;

    // 🎯 디버깅용: user 객체가 진짜 있는지 콘솔에 찍어보세요.
    console.log("👤 현재 유저 상태:", user);

    // 닉네임이 있으면 닉네임, 없으면 이메일, 둘 다 없으면 익명
    let senderName = "익명";
    if (token && user) {
      senderName = user.nickname || user.email || "나";
    }

    const chatPayload = {
      sender: senderName,
      content: content,
      userId: myId, // 👈 이제 말풍선은 이걸로 구분됨
      timestamp: new Date().toISOString(),
    };

    stompClientRef.current.publish({
      destination: `/multi/game/${roomInfo.gameId}/chat`,
      body: JSON.stringify(chatPayload),
    });
  };
  const updateDifficulty = (newDiff) => {
    if (!roomInfo?.isHost || !stompClientRef.current?.connected) return;
    stompClientRef.current.publish({
      destination: `/multi/game/${roomInfo.gameId}/settings`,
      body: JSON.stringify({
        difficulty: newDiff,
        roomCode: roomInfo.roomCode,
      }),
    });
  };

  const startMultiGame = () => {
    if (!roomInfo?.isHost || !stompClientRef.current?.connected) return;
    stompClientRef.current.publish({
      destination: `/multi/game/${roomInfo.gameId}/start`,
      body: JSON.stringify({ difficulty: roomInfo.difficulty }),
    });
  };

  if (!roomInfo) return <div>대기실 로딩 중...</div>;

  return (
    <WaitingRoom
      roomInfo={roomInfo}
      chatMessages={chatMessages}
      onSendMessage={sendChat}
      onUpdateDifficulty={updateDifficulty}
      onCancel={() => navigate("/")}
      onStartGame={startMultiGame}
      isHost={roomInfo.isHost}
    />
  );
}

export default WaitingRoomPage;
