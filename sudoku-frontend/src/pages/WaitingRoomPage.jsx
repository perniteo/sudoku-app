import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import WaitingRoom from "../components/WaitingRoom";
import { GameService } from "../services/GameService";
import { createMultiplayerClient } from "../services/socketService";

function WaitingRoomPage({ myId, token }) {
  const { roomCode } = useParams(); // 🎯 URL 주소창의 /waiting/:roomCode 추출
  const navigate = useNavigate();

  // 1. App.js에서 이사 온 대기실 전용 상태들
  const [roomInfo, setRoomInfo] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const stompClientRef = useRef(null);

  // 🎯 2. 새로고침/최초 진입 시 방 정보 동기화 및 소켓 연결
  useEffect(() => {
    const initWaitingRoom = async () => {
      try {
        // 방 정보 가져오기 (기존의 checkRecentGame이나 전용 API 활용)
        const res = await GameService.checkRecentGame(token, roomCode);
        setRoomInfo(res.data.roomInfo || res.data); // 서버 구조에 맞게 세팅

        // 🎯 소켓 연결 (대기실 전용 주소나 게임 주소 구독)
        stompClientRef.current = createMultiplayerClient(roomCode, {
          onMessage: (data) => {
            // 게임 시작 신호가 오면 주소 이동
            if (data.status === "PLAYING") {
              navigate(`/game/${roomCode}`);
            }
          },
          onChat: (chat) => setChatMessages((prev) => [...prev, chat]),
          onSettings: (settings) =>
            setRoomInfo((prev) => ({ ...prev, ...settings })),
          onError: (err) => alert(err.message),
        });
      } catch (err) {
        console.error("대기실 로드 실패:", err);
        navigate("/");
      }
    };

    initWaitingRoom();

    return () => {
      if (stompClientRef.current) stompClientRef.current.deactivate();
    };
  }, [roomCode, token, navigate]);

  // 3. 채팅 전송 핸들러
  const sendChat = (content) => {
    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination: `/multi/game/${roomCode}/chat`,
        body: JSON.stringify({ sender: myId, content }),
      });
    }
  };

  // 4. 난이도 변경 (방장 전용)
  const updateDifficulty = (newDiff) => {
    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination: `/multi/game/${roomCode}/settings`,
        body: JSON.stringify({ difficulty: newDiff, roomCode }),
      });
    }
  };

  // 5. 게임 시작 (방장 전용)
  const startMultiGame = () => {
    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination: `/multi/game/${roomCode}/start`,
        body: JSON.stringify({ difficulty: roomInfo.difficulty }),
      });
    }
  };

  if (!roomInfo) return <div>대기실 로딩 중...</div>;

  return (
    <WaitingRoom
      roomInfo={roomInfo}
      chatMessages={chatMessages}
      onSendMessage={sendChat}
      onUpdateDifficulty={updateDifficulty}
      onCancel={() => navigate("/")} // 🎯 메뉴로 이동
      onStartGame={startMultiGame}
      isHost={roomInfo.isHost}
    />
  );
}

export default WaitingRoomPage;
