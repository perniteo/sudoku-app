import { useEffect, useState, useCallback } from "react";
import SudokuBoard from "./components/SudokuBoard";
import AuthModal from "./components/AuthModal";
import GameOverlay from "./components/GameOverlay";
import Header from "./components/Header";
import MainMenu from "./components/MainMenu";
import GameInfo from "./components/GameInfo";
import NumberPad from "./components/NumberPad";
import RecordOverlay from "./components/RecordOverlay";
import api from "./api.js"; // Axios 인스턴스
import GameService from "./services/GameService";

function App() {
  const [game, setGame] = useState(null);
  const [statusMessage, setStatusMessage] = useState("대기중");
  const [difficulty, setDifficulty] = useState(4);
  const [selectedCell, setSelectedCell] = useState(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isNoteMode, setIsNoteMode] = useState(false);

  const [user, setUser] = useState(null); // 로그인한 유저 정보
  const [viewMode, setViewMode] = useState("game"); // signIn, signup, menu, game
  const [hasSavedGame, setHasSavedGame] = useState(false); // 게임 저장 여부

  const [seconds, setSeconds] = useState(0); // 경과 시간 (단위 : 초)

  const [isLoginView, setIsLoginView] = useState(true);
  const [token, setToken] = useState(
    localStorage.getItem("accessToken") || null,
  );

  const [savedGameInfo, setSavedGameInfo] = useState(null); // 서버에서 받은 이어하기 게임 정보 { difficulty, life, elapsedTime }

  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const [userStats, setUserStats] = useState({ records: [], summary: null });
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // 🎯 서버 데이터 가공 공통 함수
  const processServerData = useCallback(
    (data) => ({
      ...data,
      id: data.gameId || data.id,
      board: data.board.map((r) => r.map((c) => c.v)),
      notes: data.board.map((r) => r.map((c) => Array.from(c.m || []))),
      life: data.life ?? 3,
    }),
    [],
  );

  // 🎯 기록실 데이터를 가져오는 공통 함수 (Axios로 교체)
  const fetchUserStats = async () => {
    // 1. 토큰 체크 (api.js가 알아서 하므로 있으면 보냄)
    const currentToken = localStorage.getItem("accessToken");
    if (!currentToken) return;

    setIsStatsLoading(true);
    try {
      // 🎯 fetch 대신 우리가 만든 'api' 인스턴스 사용!
      // baseURL이 이미 설정되어 있으므로 경로만 적으면 됩니다.
      const res = await api.get("/api/records/all");

      // 🎯 Axios는 응답 데이터가 res.data에 들어있고, JSON 파싱도 자동으로 해줍니다.
      setUserStats(res.data);
    } catch (e) {
      // 401 에러가 나면 api.js 인터셉터가 재발급을 시도하고,
      // 재발급조차 실패했을 때만 이 catch문으로 옵니다.
      console.error("통계 로드 실패:", e);
    } finally {
      setIsStatsLoading(false);
    }
  };

  // 로그인 시도
  const onLoginSubmit = async (isLoginView, email, password, nickname) => {
    const endpoint = isLoginView ? "/api/auth/sign-in" : "/api/auth/signup";

    try {
      // 🎯 1. Axios로 요청 (JSON.stringify 필요 없음!)
      const res = await api.post(
        endpoint,
        isLoginView ? { email, password } : { email, password, nickname },
      );

      // 🎯 2. 응답 처리 (Axios는 성공 시 res.data에 데이터가 담깁니다)
      if (isLoginView) {
        const { accessToken, refreshToken } = res.data;

        // 🎯 3. 토큰 2개 저장 (이제 'token' 하나만 쓰면 안 됩니다!)
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        onLoginSuccess(accessToken); // 기존 상태 업데이트 유지
        alert("로그인 성공! 🎉");
      } else {
        alert("회원가입 완료! 로그인을 진행해주세요.");
        setIsLoginView(true);
      }
    } catch (err) {
      // 🎯 4. 에러 처리 (Axios는 400, 500대 에러를 바로 catch로 보냅니다)
      // 백엔드의 GlobalExceptionHandler가 주는 메시지를 읽습니다.
      const errorMsg = err.response?.data || "정보를 확인해주세요.";
      alert(`실패: ${errorMsg}`);
      console.error("Auth Error:", err);
    }
  };

  // 시간 포맷팅 함수
  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const togglePause = () => {
    setViewMode((prev) => (prev === "pause" ? "game" : "pause"));
  };

  const continueGame = async () => {
    const savedId = localStorage.getItem("sudoku_game_id");
    try {
      const data = await GameService.checkRecentGame(token ? null : savedId);
      setGame(processServerData(data));
      setSeconds(data.elapsedTime || data.accumulatedSeconds || 0);
      setViewMode("game");
    } catch (e) {
      setStatusMessage("불러오기 실패");
    }
  };

  const onLoginSuccess = async (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken); // 👈 상태가 바뀌면 아래 useEffect가 자동으로 반응함
    setUser({ token: newToken });

    // checkRecentGame(newToken); ❌ 이 줄을 삭제하여 중복 호출 방지
    setViewMode("menu");
  };

  // 🎯 이어하기 체크 (메뉴 진입 시)
  const checkRecentGame = useCallback(async () => {
    const savedId = localStorage.getItem("sudoku_game_id");
    if (!token && !savedId) return setHasSavedGame(false);
    try {
      const data = await GameService.checkRecentGame(token ? null : savedId);
      setHasSavedGame(true);
      setSavedGameInfo({
        difficulty: data.difficulty,
        life: data.life,
        elapsedTime: data.accumulatedSeconds || data.elapsedTime || 0,
      });
    } catch (e) {
      setHasSavedGame(false);
    }
  }, [token]);

  // 🎯 저장 및 로그아웃
  const saveAndExit = async () => {
    if (!game) return;
    try {
      const data = await GameService.saveAndExit(game.gameId, seconds, !token);
      setGame(null);
      setViewMode("menu");
      checkRecentGame();
    } catch (e) {
      alert("저장 실패");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setGame(null);
    setViewMode("menu");
  };

  useEffect(() => {
    const savedId = localStorage.getItem("sudoku_game_id");
    const currentToken = localStorage.getItem("accessToken");

    // 🎯 정확히 '메뉴' 화면일 때만 서버에 데이터 확인 요청
    if (!game && viewMode === "menu" && (currentToken || savedId)) {
      checkRecentGame(currentToken);
    }
  }, [viewMode, game === null, token]); // 👈 token 상태 변화도 감시 목록에 추가

  // 🎯 숫자 입력 및 메모 (Axios 사용으로 401 자동 해결)
  const placeNumber = useCallback(
    async (row, col, value) => {
      if (!game || isPlacing) return;
      setIsPlacing(true);
      try {
        const data = await GameService.placeNumber(
          game.gameId,
          row,
          col,
          value,
          seconds,
        );
        setGame(processServerData(data));
        setStatusMessage(`${data.status} (Life: ${data.life})`);
      } catch (e) {
        setStatusMessage("입력 에러");
      } finally {
        setIsPlacing(false);
      }
    },
    [game, seconds, isPlacing, processServerData],
  );

  const toggleNote = useCallback(
    async (row, col, value) => {
      if (!game || value === 0) return;
      try {
        const data = await GameService.toggleMemo(game.gameId, row, col, value);
        setGame(processServerData(data));
      } catch (e) {
        console.error("메모 저장 실패");
      }
    },
    [game, processServerData],
  );

  const toggleNoteMode = useCallback(() => {
    setIsNoteMode((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. 방어 코드: 이벤트 객체나 key가 없으면 즉시 종료
      if (!e || !e.key) return;

      // 2. 모달(Auth)이 떠 있거나 일시정지(Pause) 상태면 게임 조작 차단
      // 현재 viewMode 상태에 따라 'auth', 'pause' 등을 체크하세요.
      if (viewMode === "auth" || viewMode === "pause") return;

      // 3. 방향키 이동 로직 (화면 스크롤 방지를 위해 preventDefault 포함)
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

      // 4. 메모 모드 토글 (N키) - Optional Chaining(?.)으로 안전하게 처리
      if (e.key?.toLowerCase() === "n") {
        toggleNoteMode();
        return;
      }

      // 5. 게임 중이 아니거나 입력 불가능한 상황 차단
      if (!selectedCell || isPlacing || !game) return;

      // 6. 숫자 입력 (1~9)
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        if (isNoteMode) {
          toggleNote(selectedCell.row, selectedCell.col, num);
        } else {
          placeNumber(selectedCell.row, selectedCell.col, num);
        }
        return;
      }

      // 7. 숫자 지우기 (0, Backspace, Delete)
      if (e.key === "0" || e.key === "Backspace" || e.key === "Delete") {
        placeNumber(selectedCell.row, selectedCell.col, 0);
      }
    };

    // [window.addEventListener](https://developer.mozilla.org) 등록
    window.addEventListener("keydown", handleKeyDown);

    // 클린업 함수: 컴포넌트 언마운트 시 리스너 제거
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedCell,
    isPlacing,
    game,
    isNoteMode,
    viewMode, // 의존성 배열에 viewMode 필수 포함
    toggleNote,
    toggleNoteMode,
    placeNumber,
  ]);

  useEffect(() => {
    let interval = null;
    // 게임 중 + 일시정지 아님 + 로그인 창 아님 일 때만 실행
    if (game && game.status === "PLAYING" && viewMode === "game") {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    // 언마운트 시 클린업 (중요!)
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [game, viewMode]); // <--- game이나 viewMode가 바뀔 때마다 타이머를 재설정함

  // 🎯 게임 시작/이어하기 핸들러
  const startGame = async (difficulty) => {
    const savedId = localStorage.getItem("sudoku_game_id");
    try {
      const data = await GameService.startGame(difficulty, savedId);
      localStorage.setItem("sudoku_game_id", data.gameId);
      setGame(processServerData(data));
      setSeconds(0);
      setViewMode("game");
    } catch (e) {
      setStatusMessage("시작 실패");
    }
  };

  return (
    <div style={{ padding: "20px", position: "relative" }}>
      <h1>Sudoku</h1>

      <Header
        token={token} // localStorage 대신 상태값 사용
        onLoginClick={() => setViewMode("SIGNIN")}
        onLogout={handleLogout} // 👈 새로 만든 함수 연결
        onShowRecords={() => {
          setIsRecordOpen(true);
          fetchUserStats();
        }} // 기록 보기 버튼 핸들러
      />

      {/* 🎯 기록실 오버레이 위치: 
        조건부 렌더링으로, true일 때만 기존 화면 위에 '공중에 떠서' 나타납니다. */}
      {isRecordOpen && (
        <RecordOverlay
          records={userStats.records} // 🎯 App에서 관리하는 데이터 전달
          summary={userStats.summary} // 🎯 App에서 관리하는 통계 전달
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
          savedGameInfo={savedGameInfo} // 👈 서버에서 받은 { difficulty, life, elapsedTime }
          formatTime={formatTime} // 👈 시간 예쁘게 보여줄 함수
        />
      ) : (
        <>
          <GameInfo
            game={game}
            formatTime={formatTime}
            seconds={seconds}
            isNoteMode={isNoteMode}
            onToggleNote={toggleNoteMode}
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
              formatTime={formatTime}
              saveAndExit={saveAndExit}
              seconds={seconds}
              startGame={startGame}
              togglePause={togglePause}
            />
          </div>

          <NumberPad
            viewMode={viewMode}
            isNoteMode={isNoteMode}
            onInput={isNoteMode ? toggleNote : placeNumber}
            onErase={placeNumber}
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
