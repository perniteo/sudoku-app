import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RoomList from "../components/RoomList";
import api from "../api";

function Lobby({ myId }) {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🎯 기존 fetchRoomList 로직을 useEffect로 구현
  const fetchRoomList = async () => {
    try {
      setLoading(true);
      const res = await api.get("/rooms/list"); // 백엔드 호출
      setRooms(res.data);
    } catch (error) {
      console.error("방 목록 로드 실패:", error);
      alert("방 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomList();
    // 필요하다면 여기서 setInterval로 5초마다 fetchRoomList() 호출해서 실시간 갱신 가능
  }, []);

  // 🎯 방 참가 로직 (WaitingRoomPage로 배달)
  const handleJoinRoom = async (roomCode) => {
    try {
      // 입장 가능 확인 및 상세 정보(gameId 등) 가져오기
      const res = await api.get(
        `/rooms/join/${roomCode.toUpperCase()}?userId=${myId}`,
      );
      const { gameId, difficulty } = res.data;

      // 🚀 배달 출발! (WaitingRoomPage가 받아서 소켓 연결함)
      navigate(`/waiting/${roomCode.toUpperCase()}`, {
        state: {
          gameId: gameId,
          roomCode: roomCode.toUpperCase(),
          difficulty: difficulty,
          isHost: false,
        },
      });
    } catch (err) {
      alert(
        "방 입장에 실패했습니다: " +
          (err.response?.data?.message || err.message),
      );
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        방 목록 로딩 중...
      </div>
    );

  return (
    <RoomList
      rooms={rooms}
      onJoin={handleJoinRoom}
      onBack={() => navigate("/")}
    />
  );
}

export default Lobby;
