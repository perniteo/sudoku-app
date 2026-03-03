import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { GameService } from "../services/GameService";
import SudokuBoard from "../components/SudokuBoard";
import GameInfo from "../components/GameInfo";
import NumberPad from "../components/NumberPad";
import GameOverlay from "../components/GameOverlay";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

function GamePage({ myId, token }) {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId: urlGameId } = useParams();

  // 1. 상태 정의
  const [game, setGame] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [viewMode, setViewMode] = useState("game");

  // 🎯 대기실에서 보따리 싸온 채팅 내역 받기
  const [chatMessages, setChatMessages] = useState([]); // 빈 배열로 가볍게 시작!

  const stompClientRef = useRef(null);
  const timerRef = useRef(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

  // 🎯 1. 실시간 ID 결정 (렌더링될 때마다 최신 myId 반영)
  // 토큰이 있고 myId가 user:로 시작하면 myId를 쓰고, 아니면 URL ID를 씁니다.
  const currentEffectiveId =
    token && myId && myId.startsWith("user:") ? myId : urlGameId;

  // 🎯 2. 중복 Prefix 방어 (백엔드 500 에러 해결)
  const cleanId = currentEffectiveId.startsWith("sudoku:")
    ? currentEffectiveId.replace("sudoku:", "")
    : currentEffectiveId;

  // 디버깅용 로그: 로그인 시점에 이게 user:test@naver.com으로 바뀌는지 확인하세요.
  console.log("🆔 현재 식별자 감시:", { token: !!token, myId, cleanId });

  // 2. 시간 포맷
  const formatTime = (totalSeconds) => {
    if (!totalSeconds) return "00:00";
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 🎯 3. 멀티플레이 전용 소켓 연결 (중복 구독 방지 보강)
  const connectMultiGame = useCallback(() => {
    if (!gameId.startsWith("multi:") || stompClientRef.current?.active) return;

    const socket = new SockJS(
      `${API_BASE_URL}/ws-stomp?gameId=${gameId}&userId=${myId}`,
    );
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log("🚀 GAME STOMP:", str),
      escapeHeaderValues: false,
      onConnect: () => {
        console.log("✅ 게임 서버 연결 성공");

        // 💡 중복 구독 방지를 위해 현재 클라이언트로만 구독 진행
        // (1) 일반 게임판 업데이트
        client.subscribe(`/topic/game/${gameId}`, (msg) => {
          const data = JSON.parse(msg.body);
          setGame((prev) => ({ ...prev, ...data }));
          if (data.elapsedTime !== undefined) setSeconds(data.elapsedTime);
        });

        // 🎯 (2) 실시간 메모 수신 (기존 toggleNote 로직 완벽 이식)
        client.subscribe(`/topic/game/${gameId}/memo`, (msg) => {
          const memoData = JSON.parse(msg.body);
          const { row, col, value } = memoData;

          setGame((prev) => {
            if (!prev || !prev.board) return prev;

            // 🔥 [불변성 핵심] 2차원 배열 깊은 복사 (참조값 변경 필수)
            const newBoard = prev.board.map((r, rIdx) =>
              rIdx === row ? [...r] : r,
            );

            const targetCell = { ...newBoard[row][col] };
            const currentMemos = new Set(targetCell.m || []);

            if (currentMemos.has(value)) {
              currentMemos.delete(value);
            } else {
              currentMemos.add(value);
            }

            targetCell.m = Array.from(currentMemos);
            newBoard[row][col] = targetCell;

            // 로그가 한 번만 찍히는지 확인하세요!
            console.log(
              `🎨 [UI Update] (${row}, ${col}) 에 메모 ${value} 반영`,
            );

            return { ...prev, board: newBoard };
          });
        });

        // (3) 채팅 구독
        client.subscribe(`/topic/game/${gameId}/chat`, (msg) => {
          setChatMessages((prev) => [...prev, JSON.parse(msg.body)]);
        });
      },
    });

    client.activate();
    stompClientRef.current = client;
  }, [gameId, myId, API_BASE_URL]);

  // 4. 초기 데이터 로드 (싱글/멀티 공통)
  useEffect(() => {
    const init = async () => {
      try {
        const res = await GameService.checkRecentGame(token, gameId);
        setGame(res.data);
        setSeconds(res.data.elapsedTime || 0);

        // 멀티플레이면 소켓 연결 시작
        if (gameId.startsWith("multi:")) {
          connectMultiGame();
        }
      } catch (err) {
        console.error("로드 실패:", err);
        navigate("/");
      }
    };
    init();
    return () => {
      if (stompClientRef.current) stompClientRef.current.deactivate();
      clearInterval(timerRef.current);
    };
  }, [gameId, token, navigate, connectMultiGame]);

  // 5. 타이머 (싱글플레이 전용 - 멀티는 서버 시간을 따름)
  useEffect(() => {
    if (
      game?.status === "PLAYING" &&
      viewMode === "game" &&
      !gameId.startsWith("multi:")
    ) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [game?.status, viewMode, gameId]);

  // 6. 입력 핸들러 (싱글/멀티 분기 및 로그인 식별자 교정)
  const handleInput = useCallback(
    async (row, col, value) => {
      if (!game || isPlacing || viewMode === "pause") return;

      // 🎯 [핵심 로직] 식별자 결정 우선순위
      // 1. 로그인 토큰이 있고 myId가 user:로 시작하면 무조건 myId 사용
      // 2. 그 외에는 URL 파라미터인 gameId 사용
      const effectiveId = token && myId.startsWith("user:") ? myId : gameId;

      // 🎯 [중복 Prefix 방어] 백엔드에서 sudoku: 를 중복으로 붙여 500 에러나는 것 방지
      const cleanId = effectiveId.startsWith("sudoku:")
        ? effectiveId.replace("sudoku:", "")
        : effectiveId;

      if (gameId.startsWith("multi:")) {
        // --- 멀티플레이 로직 ---
        if (!stompClientRef.current?.connected) {
          console.warn("⚠️ 소켓이 아직 연결되지 않았습니다.");
          return;
        }

        const path = isNoteMode ? "memo" : "place";

        // 💡 [발송] 서버로 입력 정보 전송
        stompClientRef.current.publish({
          destination: `/multi/game/${gameId}/${path}`,
          body: JSON.stringify({
            row,
            col,
            value,
            elapsedTime: seconds,
            userId: myId, // 실제 행위자 ID
          }),
        });
        console.log(
          `📤 [멀티:${path}] 전송 - ID: ${effectiveId}, 값: ${value}`,
        );
      } else {
        // --- 싱글플레이 로직 ---
        setIsPlacing(true);
        try {
          // 🎯 이제 anon: 대신 정확한 user:email 경로로 API를 호출합니다.
          const res = isNoteMode
            ? await GameService.toggleMemo(cleanId, row, col, value)
            : await GameService.placeNumber(cleanId, row, col, value, seconds);

          setGame((prev) => ({ ...prev, ...res.data }));
          console.log(
            `✅ [싱글:${isNoteMode ? "메모" : "입력"}] 성공 - ID: ${cleanId}`,
          );
        } catch (err) {
          console.error("❌ 입력 실패:", err);
          // 401 에러 등이 나면 api.js 인터셉터가 처리함
        } finally {
          setIsPlacing(false);
        }
      }
    },
    // 🎯 의존성 배열에 token과 myId를 추가하여 로그인 전환 시 함수가 갱신되게 함
    [game, gameId, isNoteMode, isPlacing, seconds, myId, token, viewMode],
  );

  // 7. 채팅 전송 핸들러 (멀티플레이 전용)
  const sendChat = (content) => {
    if (!stompClientRef.current?.connected) return;
    stompClientRef.current.publish({
      destination: `/multi/game/${gameId}/chat`,
      body: JSON.stringify({ sender: token ? "나" : "익명", content }),
    });
  };

  // 8. 키보드 이벤트
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewMode !== "game") return;
      const { row, col } = selectedCell;
      if (e.key >= "1" && e.key <= "9") handleInput(row, col, parseInt(e.key));
      else if (e.key === "Backspace" || e.key === "Delete")
        handleInput(row, col, 0);
      else if (e.key === "ArrowUp")
        setSelectedCell({ row: Math.max(0, row - 1), col });
      else if (e.key === "ArrowDown")
        setSelectedCell({ row: Math.min(8, row + 1), col });
      else if (e.key === "ArrowLeft")
        setSelectedCell({ row, col: Math.max(0, col - 1) });
      else if (e.key === "ArrowRight")
        setSelectedCell({ row, col: Math.min(8, col + 1) });
      else if (e.key.toLowerCase() === "n") setIsNoteMode((prev) => !prev);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, handleInput, viewMode]);

  if (!game) return <div>로딩 중...</div>;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ opacity: viewMode === "pause" ? 0.4 : 1 }}>
        <GameInfo
          game={game}
          seconds={seconds}
          isNoteMode={isNoteMode}
          onToggleNote={() => setIsNoteMode(!isNoteMode)}
          onPause={() => setViewMode("pause")}
          formatTime={formatTime}
        />
        <SudokuBoard
          board={game.board}
          notes={game.board.map((r) => r.map((c) => Array.from(c.m || [])))}
          selectedCell={selectedCell}
          onSelectCell={setSelectedCell}
          myId={myId}
        />
        <NumberPad
          viewMode={viewMode}
          isNoteMode={isNoteMode}
          onInput={(v) => handleInput(selectedCell.row, selectedCell.col, v)}
          onErase={() => handleInput(selectedCell.row, selectedCell.col, 0)}
          selectedCell={selectedCell}
        />
        {/* 멀티플레이용 채팅 UI가 있다면 여기에 chatMessages와 sendChat 연결 */}
      </div>

      <GameOverlay
        game={game}
        setGame={setGame}
        viewMode={viewMode}
        setViewMode={setViewMode}
        saveAndExit={() => navigate("/")}
        formatTime={formatTime}
        seconds={seconds}
        setSeconds={setSeconds}
        togglePause={() =>
          setViewMode((v) => (v === "pause" ? "game" : "pause"))
        }
      />
    </div>
  );
}

export default GamePage;
