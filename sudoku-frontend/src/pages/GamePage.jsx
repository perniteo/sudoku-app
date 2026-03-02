import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { GameService } from "../services/GameService";
import { createMultiplayerClient } from "../services/socketService";
import SudokuBoard from "../components/SudokuBoard";
import GameInfo from "../components/GameInfo";
import NumberPad from "../components/NumberPad";
import GameOverlay from "../components/GameOverlay";

function GamePage({ myId, token, user, anonymousId }) {
  const { gameId } = useParams();
  const navigate = useNavigate();

  // 1. App.js에서 옮겨온 상태들
  const [game, setGame] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("플레이 중...");

  // 🎯 멀티플레이 전용 상태 (대기실 정보가 없어도 URL로 들어올 수 있으니 game 내부 정보 활용)
  const [roomInfo, setRoomInfo] = useState(null);

  const stompClientRef = useRef(null);
  const timerRef = useRef(null);

  // 2. 시간 포맷 함수
  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 3. 타이머 로직 (GamePage 내부로 이사)
  useEffect(() => {
    if (game && game.status === "PLAYING") {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [game?.status]);

  // 4. 초기화 & 새로고침 방어
  useEffect(() => {
    const initGame = async () => {
      try {
        const res = await GameService.checkRecentGame(token, gameId);
        const data = res.data;

        setGame(data);
        setSeconds(data.elapsedTime || data.accumulatedSeconds || 0);

        if (gameId.startsWith("multi:")) {
          stompClientRef.current = createMultiplayerClient(gameId, {
            onMessage: (updatedGame) => {
              setGame((prev) => ({
                ...prev,
                board: updatedGame.board,
                status: updatedGame.status,
                life: updatedGame.life,
                lastInteract: updatedGame.lastInteract,
              }));
              if (updatedGame.elapsedTime !== undefined)
                setSeconds(updatedGame.elapsedTime);
            },
            onChat: (chat) => {
              /* 채팅은 전역이나 별도 상태로 처리 */
            },
            onError: (err) => alert(err.message),
          });
        }
      } catch (err) {
        console.error("게임 로드 실패:", err);
        navigate("/");
      }
    };
    initGame();

    return () => {
      if (stompClientRef.current) stompClientRef.current.deactivate();
      clearInterval(timerRef.current);
    };
  }, [gameId, token, navigate]);

  // 5. 입력 핸들러 (handleMultiInput, toggleNote, placeNumber 복사본)
  const handleMultiInput = useCallback(
    (row, col, value) => {
      if (!stompClientRef.current?.connected) return;
      stompClientRef.current.publish({
        destination: `/multi/game/${gameId}/place`,
        body: JSON.stringify({
          row,
          col,
          value,
          elapsedTime: seconds,
          userId: myId,
        }),
      });
    },
    [gameId, seconds, myId],
  );

  const toggleNote = useCallback(
    async (row, col, value) => {
      if (!game || value === 0) return;
      try {
        if (gameId.startsWith("multi:")) {
          stompClientRef.current.publish({
            destination: `/multi/game/${gameId}/memo`,
            body: JSON.stringify({ row, col, value }),
          });
          return;
        }
        const res = await GameService.toggleMemo(gameId, row, col, value);
        setGame(res.data);
      } catch (error) {
        console.error(error);
      }
    },
    [game, gameId],
  );

  const placeNumber = useCallback(
    async (row, col, value) => {
      if (!game || isPlacing) return;

      const cellData = game.board[row][col];
      const currentValue = typeof cellData === "object" ? cellData.v : cellData;
      if (currentValue !== 0) return;

      // 낙관적 업데이트
      setGame((prev) => {
        const newBoard = [...prev.board];
        newBoard[row] = [...newBoard[row]];
        newBoard[row][col] = { v: value, i: myId, f: false };
        return { ...prev, board: newBoard };
      });

      if (gameId.startsWith("multi:")) {
        handleMultiInput(row, col, value);
        return;
      }

      setIsPlacing(true);
      try {
        const res = await GameService.placeNumber(
          gameId,
          row,
          col,
          value,
          seconds,
        );
        setGame(res.data);
        if (res.data.elapsedTime !== undefined)
          setSeconds(res.data.elapsedTime);
      } catch (error) {
        console.error(error);
      } finally {
        setIsPlacing(false);
      }
    },
    [game, gameId, seconds, isPlacing, myId],
  );

  // 🎯 6. 저장 후 나가기
  const saveAndExit = async () => {
    try {
      await GameService.saveAndExit(gameId, seconds, token);
      navigate("/");
    } catch (err) {
      alert("저장 실패");
    }
  };

  if (!game) return <div className="loading">로딩 중...</div>;

  return (
    <div className="game-page">
      <GameInfo
        game={game}
        formatTime={formatTime}
        seconds={seconds}
        isNoteMode={isNoteMode}
        onToggleNote={() => setIsNoteMode(!isNoteMode)}
        onPause={() => {
          /* 멀티는 pause 대신 메뉴 레이어 */
        }}
      />
      <div
        style={{
          position: "relative",
          display: "inline-block",
          marginTop: "20px",
        }}
      >
        <SudokuBoard
          board={game.board}
          notes={game.board.map((r) => r.map((c) => Array.from(c.m || [])))}
          selectedCell={selectedCell}
          onSelectCell={setSelectedCell}
          myId={myId}
        />
        <GameOverlay
          game={game}
          setGame={setGame}
          setSeconds={setSeconds}
          saveAndExit={saveAndExit}
          formatTime={formatTime}
          seconds={seconds}
          // startGame={...} // 재시작 로직 필요시 추가
        />
      </div>
      <NumberPad
        isNoteMode={isNoteMode}
        onInput={(r, c, v) =>
          isNoteMode ? toggleNote(r, c, v) : placeNumber(r, c, v)
        }
        onErase={() => placeNumber(selectedCell.row, selectedCell.col, 0)}
        selectedCell={selectedCell}
        isPlacing={isPlacing}
      />
    </div>
  );
}

export default GamePage;
