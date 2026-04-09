import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { GameService } from "../services/GameService";
import SudokuBoard from "../components/SudokuBoard";
import GameInfo from "../components/GameInfo";
import NumberPad from "../components/NumberPad";
import GameOverlay from "../components/GameOverlay";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import ChatWindow from "../components/ChatWindow";
import api from "../api.js";
import AuthModal from "../components/AuthModal"; // 🎯 추가

function GamePage({ myId, token, user }) {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId: urlGameId } = useParams();

  const [showAuthModal, setShowAuthModal] = useState(false); // 모달 열림 상태
  const [isLoginView, setIsLoginView] = useState(true); // 로그인/회원가입 전환 상태

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
  // console.log("🆔 현재 식별자 감시:", { token: !!token, myId, cleanId });

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

          setGame((prev) => {
            if (!prev || !prev.board) return data;

            // 🎯 [핵심] 서버 보드와 내 메모를 병합
            const mergedBoard = data.board.map((row, rIdx) =>
              row.map((cell, cIdx) => ({
                ...cell,
                // 서버에서 온 숫자가 0이 아니면 메모를 지우고, 0이면 기존 메모(m) 유지
                m: cell.v !== 0 ? [] : prev.board[rIdx][cIdx].m || [],
              })),
            );

            return {
              ...prev,
              ...data,
              board: mergedBoard, // 👈 메모가 살아있는 새 보드 주입
            };
          });
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

  // GamePage.jsx 내부

  // 🎯 5. 타이머 제어 (useEffect)
  useEffect(() => {
    const isMulti = gameId.startsWith("multi:");
    // 🎯 멀티라면 오버레이 상관없이 흐르고, 싱글은 오버레이 없을 때만 흐름
    const shouldRun =
      game?.status === "PLAYING" && (isMulti || viewMode === "game");

    if (shouldRun) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [game?.status, viewMode, gameId]);

  // 6. 입력 핸들러 (싱글/멀티 분기 및 로그인 식별자 교정)
  const handleInput = useCallback(
    async (row, col, value) => {
      // 1. 기본 방어 로직
      if (
        !game ||
        viewMode === "pause" ||
        game.status === "COMPLETED" ||
        game.status === "FAILED" ||
        showAuthModal // 👈 이 조건이 핵심!
      ) {
        console.log("🚫 입력 불가 상태입니다.");
        return;
      }

      // 🎯 [수정] roomInfo 제거하고 확실한 ID 추출 (전달받은 gameId를 우선순위로 사용 가능)
      const currentId = game.gameId || game.id || gameId;
      if (!currentId) return;

      // 🎯 [2. 낙관적 업데이트] UI 즉시 반영 (await 이전에 실행하여 반응성 극대화)
      setGame((prev) => {
        if (!prev) return prev;

        if (isNoteMode) {
          // --- 메모 모드: notes 배열만 업데이트 ---
          const newNotes = prev.notes.map((r) => [...r]);
          const currentMemos = Array.isArray(newNotes[row][col])
            ? newNotes[row][col]
            : [];

          const updatedMemos = currentMemos.includes(value)
            ? currentMemos.filter((v) => v !== value)
            : [...currentMemos, value].sort((a, b) => a - b);

          newNotes[row][col] = updatedMemos;
          return { ...prev, notes: newNotes };
        } else {
          // --- 숫자 모드: board 배열만 업데이트 ---
          const newBoard = prev.board.map((r) => [...r]);
          newBoard[row][col] = value;
          return { ...prev, board: newBoard };
        }
      });

      // 🎯 [3. 멀티플레이 분기]
      if (currentId.toString().startsWith("multi:")) {
        if (stompClientRef.current?.connected) {
          const path = isNoteMode ? "memo" : "place";
          stompClientRef.current.publish({
            destination: `/multi/game/${currentId}/${path}`,
            body: JSON.stringify({
              row,
              col,
              value,
              elapsedTime: seconds,
              userId: myId,
            }),
          });
        }
        return; // 멀티플레이는 여기서 종료
      }

      // 🎯 [4. 싱글플레이 로직]
      if (isPlacing) return;
      setIsPlacing(true);

      try {
        const endpoint = isNoteMode
          ? `/games/${currentId}/memo`
          : `/games/${currentId}/place`;
        const res = await api.post(endpoint, {
          row,
          col,
          value,
          elapsedTime: seconds,
        });

        const data = res.data;
        if (!data) return;

        if (data.elapsedTime !== undefined) setSeconds(data.elapsedTime);

        // 🎯 [서버 결과 반영] status, life 업데이트로 Overlay 출력 보장
        setGame((prev) => ({
          ...prev,
          board: data.board || prev.board,
          // 서버 데이터(c.m)를 프론트엔드 notes 형식으로 파싱
          notes: data.board
            ? data.board.map((r) => r.map((c) => Array.from(c.m || [])))
            : prev.notes,
          status: data.status || prev.status,
          life: data.life !== undefined ? data.life : prev.life,
        }));
      } catch (error) {
        console.error("💥 싱글플레이 요청 실패:", error);
      } finally {
        setIsPlacing(false);
      }
    },
    // 🎯 의존성 배열에서 roomInfo 제거, 필요한 값만 유지
    [game, isNoteMode, isPlacing, seconds, myId, gameId, viewMode],
  );

  // 7. 채팅 전송 핸들러 (멀티플레이 전용)
  const sendChat = (content) => {
    if (!stompClientRef.current?.connected) return;

    // 🎯 보낼 데이터 조립 (백엔드 ChatRequest DTO와 필드명을 맞춰야 함)
    const chatPayload = {
      sender:
        token && user?.nickname ? user.nickname : token ? user?.email : "익명",
      content: content,
      userId: myId, // 👈 이게 있어야 ChatWindow가 왼쪽/오른쪽을 나눕니다!
      timestamp: new Date().toISOString(),
    };

    stompClientRef.current.publish({
      destination: `/multi/game/${gameId}/chat`,
      body: JSON.stringify(chatPayload),
    });

    console.log("📤 [채팅 발신]:", chatPayload); // 👈 1. 콘솔로 보낸 데이터 확인
  };

  // 8. 키보드 이벤트
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 🎯 [추가] 채팅창 입력 중일 때는 게임 키보드 이벤트 무시
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }

      // 🎯 ESC는 일시정지 토글 (게임 중이 아닐 때도 반응)
      if (e.key === "Escape") {
        console.log("⌨️ ESC 눌림! 현재 모드:", viewMode);
        setViewMode((prev) => (prev === "pause" ? "game" : "pause"));
        return;
      }
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

  // 9. 저장 및 종료 핸들러 (GameOverlay에 전달)
  const handleSaveAndExit = useCallback(
    async (currentSeconds) => {
      if (!game || gameId.startsWith("multi:")) {
        navigate("/");
        return;
      }

      try {
        // 🎯 서비스에 정의된 인자 순서: (userId, elapsedTime, token)
        // gameId가 곧 userId 역할을 하므로 그대로 넣어줍니다.
        await GameService.saveAndExit(gameId, currentSeconds, token);

        console.log("✅ 저장 성공:", currentSeconds);
        navigate("/");
      } catch (err) {
        console.error("❌ 저장 실패:", err);
        navigate("/");
      }
    },
    [game, gameId, token, navigate],
  );

  if (!game) return <div>로딩 중...</div>;

  return (
    <div style={styles.pageWrapper}>
      {/* 🎯 메인 레이아웃: 멀티플레이 시 채팅창과 보드를 가로로 배치 */}
      <div style={styles.mainLayout}>
        {/* 1. 왼쪽: 수도쿠 게임 영역 */}
        <div
          style={{
            ...styles.gameSection,
            opacity: viewMode === "pause" ? 0.4 : 1,
          }}
        >
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
        </div>

        {/* 2. 오른쪽: 실시간 채팅창 (멀티플레이 전용) */}
        {gameId.startsWith("multi:") && (
          <div style={styles.sidebar}>
            <ChatWindow
              messages={chatMessages}
              onSendMessage={sendChat}
              myId={myId}
              height="600px" // 보드판 높이에 맞춰 적절히 조절
            />
            {/* 🏳️ 나중에 여기에 투표(GG) 버튼 등을 추가하면 좋습니다 */}
          </div>
        )}
      </div>

      {/* 3. 오버레이 (Pause/Win/Fail) */}
      <GameOverlay
        game={game}
        setGame={setGame}
        viewMode={viewMode}
        setViewMode={setViewMode}
        saveAndExit={handleSaveAndExit}
        formatTime={formatTime}
        seconds={seconds}
        setSeconds={setSeconds}
        togglePause={() =>
          setViewMode((v) => (v === "pause" ? "game" : "pause"))
        }
        gameId={gameId}
        setShowAuthModal={setShowAuthModal} // 👈 추가
        setIsLoginView={setIsLoginView} // 👈 추가
      />

      {/* 2. AuthModal 배치 (보통 최하단에 둠) */}
      <AuthModal
        show={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        isLoginView={isLoginView}
        setIsLoginView={setIsLoginView}
        game={game}
        onLoginSuccess={(token, userData) => {
          // 로그인 성공 시 실행할 로직
          // 예: setMyId(`user:${userData.email}`), setToken(token) 등
          setShowAuthModal(false);
        }}
      />
    </div>
  );
}

// 🎨 스타일 정의
const styles = {
  pageWrapper: {
    position: "relative",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "20px",
    backgroundColor: "#f8f9fa", // 배경색은 취향껏
  },
  mainLayout: {
    display: "flex",
    flexDirection: "row", // 가로 배치 핵심
    gap: "30px", // 보드와 채팅 사이 간격
    alignItems: "flex-start",
  },
  gameSection: {
    flex: "0 0 auto", // 보드 크기 유지
    transition: "opacity 0.3s ease",
  },
  sidebar: {
    flex: "0 0 320px", // 채팅창 너비 고정
    position: "sticky", // 스크롤 시 따라오게 함
    top: "20px",
  },
};
export default GamePage;
