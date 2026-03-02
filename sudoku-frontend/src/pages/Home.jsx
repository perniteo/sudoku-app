import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GameService } from "../services/GameService";
import MainMenu from "../components/MainMenu";

function Home({ token, anonymousId }) {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState(4);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [savedGameInfo, setSavedGameInfo] = useState(null);

  // 🎯 1. 접속 시 이어할 게임이 있는지 체크
  useEffect(() => {
    const checkGame = async () => {
      try {
        const savedId = localStorage.getItem("sudoku_game_id");
        if (!token && !savedId) return;

        const res = await GameService.checkRecentGame(token, savedId);
        if (res.data) {
          setHasSavedGame(true);
          setSavedGameInfo(res.data);
        }
      } catch (err) {
        setHasSavedGame(false);
      }
    };
    checkGame();
  }, [token]);

  // 🎯 2. 새 게임 시작
  const handleStart = async () => {
    try {
      const savedId = localStorage.getItem("sudoku_game_id");
      const res = await GameService.startGame(difficulty, savedId);
      localStorage.setItem("sudoku_game_id", res.data.gameId);
      // 🚀 게임 페이지로 이동 (URL 변경!)
      navigate(`/game/${res.data.gameId}`);
    } catch (err) {
      alert("게임 시작 실패: " + err.message);
    }
  };

  // 🎯 3. 이어하기
  const handleContinue = () => {
    const savedId = localStorage.getItem("sudoku_game_id");
    navigate(`/game/${savedId}`);
  };

  // 🎯 4. 멀티플레이 방 만들기 (방 코드는 대기실 주소가 됨)
  const handleCreateMultiRoom = async () => {
    // API 호출로 방 생성 후 navigate(`/waiting/${roomCode}`)
    // 일단 로비로 이동하는 버튼으로 써도 됨
    navigate("/lobby");
  };

  const formatTime = (totalSeconds) => {
    if (!totalSeconds) return "00:00";
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <MainMenu
      difficulty={difficulty}
      setDifficulty={setDifficulty}
      onStart={handleStart}
      onContinue={handleContinue}
      hasSavedGame={hasSavedGame}
      token={token}
      savedGameInfo={savedGameInfo}
      onCreateMultiRoom={handleCreateMultiRoom}
      onShowRoomList={() => navigate("/lobby")}
      onJoinByCode={(code) => navigate(`/waiting/${code}`)}
      formatTime={formatTime}
    />
  );
}

export default Home;
