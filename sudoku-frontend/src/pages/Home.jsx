import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GameService } from "../services/GameService";
import MainMenu from "../components/MainMenu";
import api from "../api";

function Home({ token, anonymousId, myId }) {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState(4);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [savedGameInfo, setSavedGameInfo] = useState(null);
  const hasChecked = useRef(false);

  // 🎯 1. 싱글플레이 이어하기 체크
  useEffect(() => {
    const checkGame = async () => {
      if (hasChecked.current) return;
      const currentToken = localStorage.getItem("accessToken");
      const savedAnonId = localStorage.getItem("sudoku_anon_id");
      if (!currentToken && !savedAnonId) return;
      try {
        hasChecked.current = true;
        const res = await GameService.checkRecentGame(
          currentToken,
          savedAnonId,
        );
        if (res.data) {
          setHasSavedGame(true);
          setSavedGameInfo(res.data);
        }
      } catch (err) {
        hasChecked.current = false;
      }
    };
    if (anonymousId || token) checkGame();
  }, [token, anonymousId]);

  // 🎯 2. 새 싱글 게임 시작
  const handleStart = async () => {
    try {
      const res = await GameService.startGame(difficulty, anonymousId);
      const serverGameId = res.data.gameId;
      if (serverGameId.startsWith("anon:"))
        localStorage.setItem("sudoku_anon_id", serverGameId);
      navigate(`/game/${serverGameId}`);
    } catch (err) {
      alert("게임 시작 실패: " + err.message);
    }
  };

  // 🎯 3. 멀티플레이 방 만들기
  const handleCreateMultiRoom = async (selectedDifficulty) => {
    try {
      const res = await api.post(
        `/rooms/create?difficulty=${selectedDifficulty}&userId=${myId}`,
      );

      const { roomCode, gameId } = res.data;
      console.log("✅ 방 생성 완료! gameId:", gameId);

      navigate(`/waiting/${roomCode}`, {
        state: {
          gameId: gameId,
          roomCode: roomCode,
          difficulty: selectedDifficulty,
          isHost: true,
        },
      });
    } catch (error) {
      console.error("방 생성 에러:", error);
      alert("방 생성 실패: " + error.message);
    }
  };

  return (
    <MainMenu
      difficulty={difficulty}
      setDifficulty={setDifficulty}
      onStart={handleStart}
      onContinue={() =>
        navigate(`/game/${localStorage.getItem("sudoku_anon_id")}`)
      }
      hasSavedGame={hasSavedGame}
      savedGameInfo={savedGameInfo}
      onCreateMultiRoom={handleCreateMultiRoom}
      // 🎯 4. 방 목록(Lobby)으로 이동하는 기능 추가
      onShowRoomList={() => navigate("/lobby")}
      onJoinByCode={(code) => navigate(`/waiting/${code.toUpperCase()}`)}
      formatTime={(s) =>
        `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`
      }
    />
  );
}
export default Home;
