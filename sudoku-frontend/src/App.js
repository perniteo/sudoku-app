import { useEffect, useState, useCallback } from "react";
import SudokuBoard from "./components/SudokuBoard";
import AuthModal from "./components/AuthModal";
import GameOverlay from "./components/GameOverlay";
import Header from "./components/Header";
import MainMenu from "./components/MainMenu";
import GameInfo from "./components/GameInfo";
import NumberPad from "./components/NumberPad";

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

  // 로그인 시도
  const onLoginSubmit = async (isLoginView, email, password, nickname) => {
    const endpoint = isLoginView ? "/api/auth/sign-in" : "/api/auth/signup";
    const url = `http://localhost:8080${endpoint}`;

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
    if (!token) {
      setStatusMessage("로그인이 필요합니다.");
      return;
    }

    setStatusMessage("이전 게임 불러오는 중...");
    try {
      const res = await fetch("/games/recent", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("진행 중인 게임이 없습니다.");
      }

      const data = await res.json();
      console.log("Continued Game:", data);

      setGame({
        ...data,
        // 서버에서 받아온 메모와 시간을 상태에 반영
        notes:
          data.notes ||
          Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => [])),
        life: data.life,
        difficulty: data.difficulty,
      });

      // 타이머 시간 동기화 (seconds 상태가 있다면)
      if (data.elapsedTime) setSeconds(data.elapsedTime);

      setStatusMessage("게임을 이어서 시작합니다.");
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  // 로그인 성공 시 실행할 함수
  const onLoginSuccess = async (token) => {
    localStorage.setItem("token", token);
    setUser({ token });

    // 1. 만약 현재 게임이 완료(COMPLETED) 상태라면 서버에 기록 저장 요청
    if (game && game.status === "COMPLETED") {
      try {
        await fetch(`/games/${game.gameId}/record`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            difficulty: game.difficulty,
            elapsedTime: seconds,
          }),
        });
        setStatusMessage("기록이 성공적으로 저장되었습니다!");
      } catch (e) {
        console.error("기록 저장 실패:", e);
      }
    }

    checkRecentGame(token);
    // 2. 화면 모드 결정: 게임 완료 상태면 그대로 두고, 아니면 메뉴로
    if (game && game.status === "COMPLETED") {
      setViewMode("game"); // 오버레이 유지를 위해 game 모드로
    } else {
      setViewMode("menu");
    }
  };

  // 이어하기 데이터가 있는지 서버에 확인

  const checkRecentGame = useCallback(async (token) => {
    try {
      const response = await fetch("/games/recent", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      const { hasSavedGame } = await response.json();
      setHasSavedGame(Boolean(hasSavedGame));
    } catch (error) {
      console.error("이어하기 데이터 확인 실패:", error);
      setHasSavedGame(false);
    }
  }, []);

  // 1. 메모 토글 함수 (깊은 복사 적용)
  const toggleNote = useCallback((row, col, value) => {
    if (value === 0) return;

    setGame((prev) => {
      if (!prev || !prev.notes) return prev;

      // 2차원 배열 깊은 복사 (map 사용)
      const newNotes = prev.notes.map((r, rIdx) =>
        r.map((c, cIdx) => {
          if (rIdx === row && cIdx === col) {
            return c.includes(value)
              ? c.filter((v) => v !== value)
              : [...c, value].sort((a, b) => a - b);
          }
          return c;
        }),
      );

      return { ...prev, notes: newNotes };
    });
  }, []);

  const toggleNoteMode = useCallback(() => {
    setIsNoteMode((prev) => !prev);
  }, []);

  // 2. 숫자 입력: POST /games/{id}/place
  const placeNumber = useCallback(
    async (row, col, value) => {
      if (!game || isPlacing) return;

      const token = localStorage.getItem("token");

      if (!game) return;
      setIsPlacing(true);
      setStatusMessage("숫자 입력 중...");
      try {
        const res = await fetch(`/games/${game.gameId}/place`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            row,
            col,
            value,
            elapsedTime: seconds,
            notes: game.notes,
          }),
        });
        const data = await res.json();
        setGame((prev) => ({
          ...prev,
          board: data.board,
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
    try {
      const res = await fetch("/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty }),
      });
      const data = await res.json();

      // 새 게임 시작 시 시계 리셋
      setSeconds(0);
      // 2. 새 게임 데이터 주입 (status가 PLAYING인지 확인하세요)
      setGame({
        ...data,
        life: data.life ?? 3,
        notes: Array.from({ length: 9 }, () =>
          Array.from({ length: 9 }, () => []),
        ),
        difficulty,
      });

      // 3. 화면 모드를 'game'으로 변경 (이게 되어야 위 useEffect가 돌아감)
      setViewMode("game");
      setStatusMessage(data.status);
    } catch (error) {
      setStatusMessage("에러: " + error.message);
    }
  };

  return (
    <div style={{ padding: "20px", position: "relative" }}>
      <h1>Sudoku</h1>

      <Header
        token={localStorage.getItem("token")}
        onLoginClick={() => setViewMode("SIGNIN")}
        onLogout={() => {
          localStorage.removeItem("token");
          window.location.reload();
        }}
      />

      {!game ? (
        <MainMenu
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          onStart={startGame}
          onContinue={continueGame}
          hasSavedGame={hasSavedGame}
          token={localStorage.getItem("token")}
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
