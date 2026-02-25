import { useEffect, useState, useCallback } from "react";
import SudokuBoard from "./components/SudokuBoard";
import AuthModal from "./components/AuthModal";
import GameOverlay from "./components/GameOverlay";
import Header from "./components/Header";
import MainMenu from "./components/MainMenu";
import GameInfo from "./components/GameInfo";
import NumberPad from "./components/NumberPad";
import RecordOverlay from "./components/RecordOverlay";
import api from "./api.js"; // 🎯 Axios 인스턴스

function App() {
  const [game, setGame] = useState(null);
  const [statusMessage, setStatusMessage] = useState("대기중");
  const [difficulty, setDifficulty] = useState(4);
  const [selectedCell, setSelectedCell] = useState(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isNoteMode, setIsNoteMode] = useState(false);

  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState("game");
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const [isLoginView, setIsLoginView] = useState(true);
  const [token, setToken] = useState(
    localStorage.getItem("accessToken") || null,
  );
  const [savedGameInfo, setSavedGameInfo] = useState(null);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const [userStats, setUserStats] = useState({ records: [], summary: null });
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // 🎯 시간 포맷 함수 (원본 그대로 복구)
  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 🎯 기록실 통계 로드 (원본 로직 + api.js 적용)
  const fetchUserStats = async (passedToken) => {
    const activeToken = passedToken || token;
    if (!activeToken) return;
    setIsStatsLoading(true);
    try {
      const res = await api.get("/api/records/all");
      setUserStats(res.data);
    } catch (e) {
      console.error("통계 로드 실패:", e);
    } finally {
      setIsStatsLoading(false);
    }
  };

  // 🎯 로그인/회원가입 (원본 로직 + api.js 적용)
  const onLoginSubmit = async (isLoginView, email, password, nickname) => {
    const endpoint = isLoginView ? "/api/auth/sign-in" : "/api/auth/signup";
    try {
      const res = await api.post(
        endpoint,
        isLoginView ? { email, password } : { email, password, nickname },
      );
      if (isLoginView) {
        const { accessToken, refreshToken } = res.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        onLoginSuccess(accessToken);
        alert("로그인 성공! 🎉");
      } else {
        alert("회원가입 완료! 로그인을 진행해주세요.");
        setIsLoginView(true);
      }
    } catch (err) {
      const errorMsg = err.response?.data || "정보를 확인해주세요.";
      alert(`실패: ${errorMsg}`);
    }
  };

  const onLoginSuccess = async (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser({ token: newToken });
    setViewMode("menu");
  };
  // 🎯 게임 시작 (fetch -> api.post 교체, 네 원본 로직 100%)
  const startGame = async () => {
    setStatusMessage("게임 생성 중...");
    const savedId = localStorage.getItem("sudoku_game_id");
    const validId = savedId && savedId !== "undefined" ? savedId : "";

    try {
      // 🎯 이제 여기서 401 나면 api.js가 알아서 reissue 해옴
      const res = await api.post(
        validId ? `/games/start/${validId}` : `/games/start`,
        { difficulty },
      );
      const data = res.data;

      localStorage.setItem("sudoku_game_id", data.gameId);

      const serverBoard = data.board;
      const newBoard = serverBoard.map((r) => r.map((c) => c.v));
      const newNotes = serverBoard.map((r) =>
        r.map((c) => Array.from(c.m || [])),
      );

      setSeconds(0);
      setGame({
        ...data,
        id: data.gameId,
        board: newBoard,
        notes: newNotes,
        life: data.life ?? 3,
        difficulty,
      });
      setViewMode("game");
      setStatusMessage(data.status);
    } catch (error) {
      setStatusMessage("에러: " + error.message);
    }
  };

  // 🎯 이어하기 (네 원본 로직 100% 복구 - 이게 빠져서 안 눌린 거다!)
  const continueGame = async () => {
    const savedId = localStorage.getItem("sudoku_game_id");
    const currentToken = localStorage.getItem("accessToken");
    if (!currentToken && !savedId) {
      setStatusMessage("진행 중인 게임 정보를 찾을 수 없습니다.");
      return;
    }
    setStatusMessage("이전 게임 불러오는 중...");

    try {
      // 🎯 토큰 있으면 /games, 없으면 /games/uuid 호출
      const res = await api.get(currentToken ? `/games` : `/games/${savedId}`);
      const data = res.data;

      const serverBoard = data.board;
      const newBoard = serverBoard.map((row) => row.map((cell) => cell.v));
      const newNotes = serverBoard.map((row) =>
        row.map((cell) => Array.from(cell.m || [])),
      );

      setGame({
        ...data,
        id: data.gameId || data.id,
        board: newBoard,
        notes: newNotes,
        life: data.life || 3,
        difficulty: data.difficulty,
      });

      if (data.elapsedTime || data.accumulatedSeconds) {
        setSeconds(data.elapsedTime || data.accumulatedSeconds);
      }

      setSelectedCell({ row: 0, col: 0 });
      setViewMode("game");
      setIsNoteMode(false);
      setStatusMessage("게임을 이어서 시작합니다.");
      setHasSavedGame(true);
    } catch (error) {
      setStatusMessage("불러오기 실패: " + error.message);
      setHasSavedGame(false);
    }
  };

  // 🎯 이어하기 데이터 체크 (메뉴 화면용)
  const checkRecentGame = useCallback(async (passedToken) => {
    const activeToken = passedToken || localStorage.getItem("accessToken");
    const savedId = localStorage.getItem("sudoku_game_id");
    if (!activeToken && !savedId) {
      setHasSavedGame(false);
      return;
    }
    try {
      const res = await api.get(activeToken ? `/games` : `/games/${savedId}`);
      const data = res.data;
      setHasSavedGame(true);
      setSavedGameInfo({
        difficulty: data.difficulty,
        life: data.life,
        elapsedTime: data.accumulatedSeconds || data.elapsedTime || 0,
      });
    } catch (error) {
      setHasSavedGame(false);
      setSavedGameInfo(null);
    }
  }, []);
  // 🎯 숫자 입력 (원본 100% + api.js 적용)
  const placeNumber = useCallback(
    async (row, col, value) => {
      if (!game || isPlacing) return;
      setIsPlacing(true);
      setStatusMessage("숫자 입력 중...");

      try {
        // 🎯 이제 여기서 401 나면 api.js가 알아서 reissue 해옴
        const res = await api.post(`/games/${game.gameId}/place`, {
          row,
          col,
          value,
          elapsedTime: seconds,
        });
        const data = res.data;

        const serverBoard = data.board;
        setGame((prev) => ({
          ...prev,
          board: serverBoard.map((r) => r.map((c) => c.v)),
          notes: serverBoard.map((r) => r.map((c) => Array.from(c.m || []))),
          status: data.status,
          life: data.life,
        }));
        setStatusMessage(`${data.status} (life: ${data.life})`);
      } catch (error) {
        setStatusMessage("에러: " + error.message);
      } finally {
        setIsPlacing(false);
      }
    },
    [game, seconds, isPlacing],
  );

  // 🎯 메모 토글 (원본 100% + api.js 적용)
  const toggleNote = useCallback(
    async (row, col, value) => {
      if (!game || value === 0) return;
      try {
        const res = await api.post(`/games/${game.gameId}/memo`, {
          row,
          col,
          value,
        });
        const data = res.data;
        const serverBoard = data.board;
        setGame((prev) => ({
          ...prev,
          board: serverBoard.map((r) => r.map((c) => c.v)),
          notes: serverBoard.map((r) => r.map((c) => Array.from(c.m || []))),
        }));
      } catch (error) {
        console.error("메모 저장 실패:", error);
      }
    },
    [game],
  );

  // 🎯 저장 및 종료 (원본 100% + api.js 적용)
  const saveAndExit = async () => {
    if (!game) return;
    const currentToken = localStorage.getItem("accessToken");
    const savedId = localStorage.getItem("sudoku_game_id");
    try {
      const res = await api.post(
        currentToken ? `/games/save` : `/games/${savedId}/save`,
        {
          elapsedTime: seconds,
        },
      );
      const data = res.data;
      setSavedGameInfo({
        difficulty: data.difficulty,
        life: data.life,
        elapsedTime: data.elapsedTime || data.accumulatedSeconds,
      });
      setHasSavedGame(true);
      setGame(null);
      setViewMode("menu");
    } catch (error) {
      console.error("저장 실패:", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    setHasSavedGame(false);
    setSavedGameInfo(null);
    setViewMode("menu");
    setStatusMessage("로그아웃 되었습니다.");
  };

  // --- Effects (네 원본 그대로) ---
  useEffect(() => {
    const savedId = localStorage.getItem("sudoku_game_id");
    const currentToken = localStorage.getItem("accessToken");
    if (!game && viewMode === "menu" && (currentToken || savedId)) {
      checkRecentGame(currentToken);
    }
  }, [viewMode, game === null, token, checkRecentGame]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!e || !e.key || viewMode === "auth" || viewMode === "pause") return;
      const moveKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (moveKeys.includes(e.key)) {
        e.preventDefault();
        setSelectedCell((prev) => {
          if (!prev) return { row: 0, col: 0 };
          let { row, col } = prev;
          if (e.key === "ArrowUp") row = Math.max(0, row - 1);
          if (e.key === "ArrowDown") row = Math.min(8, row + 1);
          if (e.key === "ArrowLeft") col = Math.max(0, col - 1);
          if (e.key === "ArrowRight") col = Math.min(8, col + 1);
          return { row, col };
        });
        return;
      }
      if (e.key.toLowerCase() === "n") {
        setIsNoteMode((prev) => !prev);
        return;
      }
      if (!selectedCell || isPlacing || !game) return;
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        isNoteMode
          ? toggleNote(selectedCell.row, selectedCell.col, num)
          : placeNumber(selectedCell.row, selectedCell.col, num);
      } else if (["0", "Backspace", "Delete"].includes(e.key)) {
        placeNumber(selectedCell.row, selectedCell.col, 0);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedCell,
    isPlacing,
    game,
    isNoteMode,
    viewMode,
    toggleNote,
    placeNumber,
  ]);

  useEffect(() => {
    let interval = null;
    if (game?.status === "PLAYING" && viewMode === "game") {
      interval = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [game, viewMode]);

  // --- Render (네 원본 UI & Props 100% 복구) ---
  return (
    <div style={{ padding: "20px", position: "relative" }}>
      <h1>Sudoku</h1>
      <Header
        token={token}
        onLoginClick={() => setViewMode("SIGNIN")}
        onLogout={handleLogout}
        onShowRecords={() => {
          setIsRecordOpen(true);
          fetchUserStats();
        }}
      />
      {isRecordOpen && (
        <RecordOverlay
          records={userStats.records}
          summary={userStats.summary}
          token={token}
          onClose={() => setIsRecordOpen(false)}
          formatTime={formatTime}
        />
      )}
      {!game ? (
        <MainMenu
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          onStart={startGame}
          onContinue={continueGame}
          hasSavedGame={hasSavedGame}
          token={token}
          savedGameInfo={savedGameInfo}
          formatTime={formatTime}
        />
      ) : (
        <>
          <GameInfo
            game={game}
            formatTime={formatTime}
            seconds={seconds}
            isNoteMode={isNoteMode}
            onToggleNote={() => setIsNoteMode(!isNoteMode)}
            onPause={() => setViewMode("pause")}
          />
          <div style={{ position: "relative", display: "inline-block" }}>
            <SudokuBoard
              board={game.board}
              notes={game.notes}
              selectedCell={selectedCell}
              onSelectCell={setSelectedCell}
            />
            <GameOverlay
              game={game}
              viewMode={viewMode}
              setViewMode={setViewMode}
              setGame={setGame}
              setSeconds={setSeconds}
              saveAndExit={saveAndExit}
              formatTime={formatTime}
              seconds={seconds}
              startGame={startGame}
              togglePause={() =>
                setViewMode((v) => (v === "pause" ? "game" : "pause"))
              }
            />
          </div>
          <NumberPad
            viewMode={viewMode}
            isNoteMode={isNoteMode}
            onInput={isNoteMode ? toggleNote : placeNumber}
            onErase={() => placeNumber(selectedCell.row, selectedCell.col, 0)}
            selectedCell={selectedCell}
            isPlacing={isPlacing}
          />
        </>
      )}
      <AuthModal
        show={viewMode === "SIGNIN"}
        isLoginView={isLoginView}
        setIsLoginView={setIsLoginView}
        game={game}
        setViewMode={setViewMode}
        onLoginSubmit={onLoginSubmit}
      />
      <p style={{ marginTop: "20px" }}>{statusMessage}</p>
    </div>
  );
}
export default App;
