import { useEffect, useState, useCallback } from "react";
import SudokuBoard from "./components/SudokuBoard";
import AuthModal from "./components/AuthModal";
import GameOverlay from "./components/GameOverlay";
import Header from "./components/Header";
import MainMenu from "./components/MainMenu";
import GameInfo from "./components/GameInfo";
import NumberPad from "./components/NumberPad";
import RecordOverlay from "./components/RecordOverlay";

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
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  const [savedGameInfo, setSavedGameInfo] = useState(null); // 서버에서 받은 이어하기 게임 정보 { difficulty, life, elapsedTime }

  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const [userStats, setUserStats] = useState({ records: [], summary: null });
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // 🎯 기록실 데이터를 가져오는 공통 함수
  const fetchUserStats = async (passedToken) => {
    const activeToken = passedToken || token;
    if (!activeToken) return;

    setIsStatsLoading(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/records/all`,
        {
          headers: { Authorization: `Bearer ${activeToken}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setUserStats(data); // { records: [...], summary: {...} }
      }
    } catch (e) {
      console.error("통계 로드 실패:", e);
    } finally {
      setIsStatsLoading(false);
    }
  };

  // 로그인 시도
  const onLoginSubmit = async (isLoginView, email, password, nickname) => {
    const endpoint = isLoginView ? "/api/auth/sign-in" : "/api/auth/signup";
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 로그인일 땐 nickname 제외, 가입일 땐 포함
        body: JSON.stringify(
          isLoginView ? { email, password } : { email, password, nickname },
        ),
      });

      if (res.ok) {
        const data = await res.text(); // 스프링이 주는 토큰이나 메시지
        if (isLoginView) {
          // [localStorage](https://developer.mozilla.org) 저장
          localStorage.setItem("token", data);
          onLoginSuccess(data); // 로그인 성공 상태 업데이트 함수
          alert("로그인 성공!");
        } else {
          alert("회원가입이 완료되었습니다. 로그인을 진행해주세요.");
          setIsLoginView(true); // 로그인 화면으로 전환
        }
      } else {
        alert("실패했습니다. 정보를 확인해주세요.");
      }
    } catch (err) {
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
    const token = localStorage.getItem("token");
    const savedId = localStorage.getItem("sudoku_game_id");

    // 1. 식별자가 아예 없으면 중단
    if (!token && !savedId) {
      setStatusMessage("진행 중인 게임 정보를 찾을 수 없습니다.");
      return;
    }

    setStatusMessage("이전 게임 불러오는 중...");

    // 2. URL 결정 (로그인 우선순위)
    const url = token
      ? `${API_BASE_URL}/games`
      : `${API_BASE_URL}/games/${savedId}`;

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, { method: "GET", headers });

      if (!res.ok) {
        throw new Error("진행 중인 게임이 없습니다.");
      }

      const data = await res.json();
      console.log("Continued Game Data:", data);

      // 서버가 준 data.board (CellRedisDto[][]) 가공
      const serverBoard = data.board;
      const newBoard = serverBoard.map((row) => row.map((cell) => cell.v));
      const newNotes = serverBoard.map((row) =>
        row.map((cell) => Array.from(cell.m || [])),
      );

      // 3. 서버 데이터를 리액트 상태(game)로 주입
      setGame({
        ...data,
        id: data.gameId || data.id, // 백엔드 필드명 확인
        board: newBoard,
        life: data.life || 3, // life가 없으면 기본 3
        difficulty: data.difficulty,
        // 메모 데이터 초기화 방어 (서버에 없으면 9x9 빈 배열)
        notes: newNotes,
      });

      // 4. UI 상태 동기화 (먹통 방지 핵심)
      if (data.elapsedTime) setSeconds(data.elapsedTime); // 시간 복구

      setSelectedCell({ row: 0, col: 0 }); // 🎯 첫 셀 강제 선택 (키보드 활성화)
      setViewMode("game"); // 🎯 게임 화면으로 전환 (조작 차단 해제)
      setIsNoteMode(false); // 노트 모드 초기화

      setStatusMessage("게임을 이어서 시작합니다.");
      setHasSavedGame(true); // 버튼 상태 동기화
    } catch (error) {
      setStatusMessage(error.message);
      setHasSavedGame(false);
    }
  };

  const onLoginSuccess = async (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken); // 👈 상태가 바뀌면 아래 useEffect가 자동으로 반응함
    setUser({ token: newToken });

    // checkRecentGame(newToken); ❌ 이 줄을 삭제하여 중복 호출 방지
    setViewMode("menu");
  };

  // 메모 저장 함수 (게임 상태가 바뀔 때마다 호출, placeNumber에서도 호출)
  const saveNoteToServer = useCallback(
    async (row, col, value) => {
      if (!game) return;
      const token = localStorage.getItem("token");

      try {
        // 백엔드에 메모 업데이트 API가 있다고 가정 (없다면 컨트롤러에 추가 필요)
        await fetch(`${API_BASE_URL}/games/${game.gameId}/memo`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ row, col, value }),
        });
      } catch (error) {
        console.error("메모 저장 실패:", error);
      }
    },
    [game],
  );

  // 이어하기 데이터가 있는지 서버에 확인

  const checkRecentGame = useCallback(async (passedToken) => {
    // 🎯 중요: 상태값 대신 인자로 받은 passedToken이나 로컬스토리지를 직접 참조
    const activeToken = passedToken || localStorage.getItem("token");
    const savedId = localStorage.getItem("sudoku_game_id");

    // 1. 식별자가 아예 없으면 서버에 물어볼 필요도 없음
    if (!token && !savedId) {
      setHasSavedGame(false);
      return;
    }

    // 2. URL 결정: 토큰 있으면 /games (백엔드가 JWT 우선), 없으면 /games/anon:uuid
    const url = activeToken
      ? `${API_BASE_URL}/games`
      : `${API_BASE_URL}/games/${savedId}`;

    try {
      const headers = { "Content-Type": "application/json" };
      if (activeToken) headers["Authorization"] = `Bearer ${activeToken}`;
      const response = await fetch(url, { headers });

      // 3. 서버가 200 OK를 주면 게임 데이터가 있는 것
      if (response.ok) {
        const data = await response.json(); // 서버 응답 데이터 (게임 정보)

        // 만약 백엔드가 단순히 true/false만 주는 게 아니라 게임 객체를 준다면
        // 여기서 바로 setGame을 해서 자동 이어하기를 시킬 수도 있음
        setHasSavedGame(true);
        // 🎯 메인 메뉴 UI에 뿌려줄 정보만 따로 저장
        setSavedGameInfo({
          difficulty: data.difficulty,
          life: data.life,
          elapsedTime: data.accumulatedSeconds || data.elapsedTime || 0,
        });
      } else {
        setHasSavedGame(false);
        setSavedGameInfo(null); // 데이터 없으면 초기화
      }
    } catch (error) {
      console.error("이어하기 체크 중 에러:", error);
      setHasSavedGame(false);
      setSavedGameInfo(null);
    }
  }, []);

  const saveAndExit = async () => {
    if (!game) return;

    const token = localStorage.getItem("token");
    const savedId = localStorage.getItem("sudoku_game_id");
    const url = token
      ? `${API_BASE_URL}/games/save`
      : `${API_BASE_URL}/games/${savedId}/save`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ elapsedTime: seconds }),
      });

      if (res.ok) {
        // 🎯 1. 서버가 보내준 따끈따끈한 최신 데이터를 파싱합니다.
        const data = await res.json();
        console.log("서버 저장 및 최신 데이터 수신 완료:", data);

        // 🎯 2. 메뉴로 가기 전에 정보를 즉시 최신화합니다.
        setSavedGameInfo({
          difficulty: data.difficulty,
          life: data.life,
          elapsedTime: data.elapsedTime || data.accumulatedSeconds,
        });
        setHasSavedGame(true);

        // 🎯 3. 마지막으로 UI를 전환합니다.
        setGame(null);
        setViewMode("menu");
      } else {
        alert("저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("저장 중 네트워크 에러:", error);
    }
  };

  useEffect(() => {
    const savedId = localStorage.getItem("sudoku_game_id");
    const currentToken = localStorage.getItem("token");

    // 🎯 정확히 '메뉴' 화면일 때만 서버에 데이터 확인 요청
    if (!game && viewMode === "menu" && (currentToken || savedId)) {
      checkRecentGame(currentToken);
    }
  }, [viewMode, game === null, token]); // 👈 token 상태 변화도 감시 목록에 추가

  // 1. 메모 토글 함수 (깊은 복사 적용)
  const toggleNote = useCallback(
    async (row, col, value) => {
      if (!game || value === 0) return;

      // 1. (선택사항) 낙관적 업데이트: 서버 응답 전 UI를 먼저 바꿈 (속도감 up)
      // 기존 toggleNote 로직을 여기에 넣어도 되지만, 일단 서버 응답 동기화를 우선합니다.

      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API_BASE_URL}/games/${game.gameId}/memo`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ row, col, value }),
        });

        if (res.ok) {
          const data = await res.json();
          // 백엔드에서 준 CellRedisDto[][] (board 필드) 가공
          const serverBoard = data.board;

          setGame((prev) => ({
            ...prev,
            // 서버의 최신 숫자판(v)과 메모판(m)을 상태에 반영
            board: serverBoard.map((r) => r.map((c) => c.v)),
            notes: serverBoard.map((r) => r.map((c) => Array.from(c.m || []))),
          }));
        }
      } catch (error) {
        console.error("메모 저장 실패:", error);
      }
    },
    [game],
  ); // token은 localStorage에서 직접 가져오므로 game만 의존성 추가

  const toggleNoteMode = useCallback(() => {
    setIsNoteMode((prev) => !prev);
  }, []);

  // 2. 숫자 입력: POST /games/{id}/place
  const placeNumber = useCallback(
    async (row, col, value) => {
      if (!game || isPlacing) return;
      const token = localStorage.getItem("token");
      setIsPlacing(true);
      setStatusMessage("숫자 입력 중...");

      try {
        const res = await fetch(`${API_BASE_URL}/games/${game.gameId}/place`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ row, col, value, elapsedTime: seconds }),
        });
        const data = await res.json();

        // 서버가 준 CellRedisDto[][] 가공 (v: 값, m: 메모)
        const serverBoard = data.board;
        const newBoard = serverBoard.map((r) => r.map((c) => c.v));
        const newNotes = serverBoard.map((r) =>
          r.map((c) => Array.from(c.m || [])),
        );

        setGame((prev) => ({
          ...prev,
          board: newBoard,
          notes: newNotes, // 메모 동기화 핵심
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

  // 게임 시작
  const startGame = async () => {
    setStatusMessage("게임 생성 중...");

    // 1. 저장된 데이터 가져오기
    const savedId = localStorage.getItem("sudoku_game_id");
    const token = localStorage.getItem("token");

    // 2. URL 결정 (기존 ID가 있으면 경로에 추가)
    const url = savedId
      ? `${API_BASE_URL}/games/start/${savedId}`
      : `${API_BASE_URL}/games/start`;
    try {
      const res = await fetch(url, {
        method: "POST", // 👈 반드시 POST여야 405 에러가 안 납니다!
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ difficulty }),
      });
      const data = await res.json();

      localStorage.setItem("sudoku_game_id", data.gameId);

      const serverBoard = data.board;
      const newBoard = serverBoard.map((r) => r.map((c) => c.v));
      // 시작 시점에는 m이 비어있겠지만, 구조를 일관되게 가져갑니다.
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

  const handleLogout = () => {
    // 1. 저장소 청소
    localStorage.removeItem("token");
    localStorage.removeItem("sudoku_game_id"); // 익명 정보도 같이 삭제 권장

    // 2. 리액트 상태 초기화 (이게 바뀌어야 UI가 반응함)
    setToken(null);
    setUser(null);
    setHasSavedGame(false);
    setSavedGameInfo(null);

    // 3. 화면 이동
    setViewMode("menu");
    setStatusMessage("로그아웃 되었습니다.");
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
