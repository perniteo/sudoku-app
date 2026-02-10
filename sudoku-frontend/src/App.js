import { useEffect, useState, useCallback } from "react";
import SudokuBoard from "./components/SudokuBoard";

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

  const checkRecentGame = async (token) => {
    try {
      const res = await fetch("/games/recent", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setHasSavedGame(data.hasSavedGame);
    } catch (error) {
      console.error("이어하기 데이터 확인 실패:", error);
    }
  };

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
      // 1. 일시정지(pause) 상태면 키보드 조작 전체 차단 (단, ESC 등으로 해제하고 싶다면 여기에 추가)
      if (viewMode === "pause") return;

      // 2. 방향키 이동 로직
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
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

      // 3. 메모 모드 토글 (N키)
      if (e.key.toLowerCase() === "n") {
        toggleNoteMode();
        return;
      }

      // 4. 게임 중이 아닐 때 입력 차단
      if (!selectedCell || isPlacing || !game) return;

      // 5. 숫자 입력 (메모 모드 여부에 따라 분기)
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        if (isNoteMode) {
          toggleNote(selectedCell.row, selectedCell.col, num);
        } else {
          placeNumber(selectedCell.row, selectedCell.col, num);
        }
      }

      // 6. 지우기
      if (e.key === "0" || e.key === "Backspace" || e.key === "Delete") {
        // 메모 모드일 때 지우기 동작을 넣고 싶다면 여기에 toggleNote 로직 추가 가능
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
    viewMode, // viewMode 추가: 일시정지 상태 감지용
    toggleNote,
    toggleNoteMode,
    placeNumber,
  ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. 일시정지(pause) 상태면 키보드 조작 전체 차단 (단, ESC 등으로 해제하고 싶다면 여기에 추가)
      if (viewMode === "pause") return;

      // 2. 방향키 이동 로직
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
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

      // 3. 메모 모드 토글 (N키)
      if (e.key.toLowerCase() === "n") {
        toggleNoteMode();
        return;
      }

      // 4. 게임 중이 아닐 때 입력 차단
      if (!selectedCell || isPlacing || !game) return;

      // 5. 숫자 입력 (메모 모드 여부에 따라 분기)
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        if (isNoteMode) {
          toggleNote(selectedCell.row, selectedCell.col, num);
        } else {
          placeNumber(selectedCell.row, selectedCell.col, num);
        }
      }

      // 6. 지우기
      if (e.key === "0" || e.key === "Backspace" || e.key === "Delete") {
        // 메모 모드일 때 지우기 동작을 넣고 싶다면 여기에 toggleNote 로직 추가 가능
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
    viewMode, // viewMode 추가: 일시정지 상태 감지용
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

      {/* 1. 상단 로그인/로그아웃: 게임 중이든 아니든 상시 노출 */}
      <div style={{ marginBottom: "20px", textAlign: "right" }}>
        {!localStorage.getItem("token") ? (
          <button onClick={() => setViewMode("SIGNIN")}>
            로그인 / 회원가입
          </button>
        ) : (
          <span>
            로그인됨{" "}
            <button
              onClick={() => {
                localStorage.removeItem("token");
                window.location.reload();
              }}
            >
              로그아웃
            </button>
          </span>
        )}
      </div>

      {!game ? (
        /* --- 2. 메뉴 화면 (게임 시작 전) --- */
        <div
          style={{
            border: "1px solid #eee",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <label>난이도: </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
            >
              {[4, 5, 6, 7, 8, 9, 10, 11].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <button onClick={startGame} style={{ marginLeft: "10px" }}>
              새 게임 시작
            </button>
          </div>
          <button
            onClick={continueGame}
            disabled={!localStorage.getItem("token") || !hasSavedGame}
            style={{
              backgroundColor:
                localStorage.getItem("token") && hasSavedGame
                  ? "#4CAF50"
                  : "#ccc",
              color: "white",
              padding: "10px 20px",
              border: "none",
              cursor: "pointer",
            }}
          >
            이어서 하기
          </button>
        </div>
      ) : (
        /* --- 3. 게임 플레이 영역 --- */
        <>
          <div style={{ marginBottom: "10px" }}>
            <p>
              상태: {game.status} / 목숨: {game.life} / 난이도:{" "}
              {game.difficulty}
            </p>
            <h2 style={{ fontFamily: "monospace" }}>{formatTime(seconds)}</h2>
            <button
              onClick={toggleNoteMode}
              style={{
                padding: "8px 16px",
                backgroundColor: isNoteMode ? "#ffeb3b" : "#eee",
                marginRight: "10px",
              }}
            >
              메모 모드: {isNoteMode ? "ON" : "OFF"} (N)
            </button>
            {/* 게임 중 PAUSE 버튼 */}
            <button
              onClick={() => setViewMode("pause")}
              style={{ padding: "8px 16px" }}
            >
              PAUSE
            </button>
          </div>

          <div style={{ position: "relative", display: "inline-block" }}>
            <SudokuBoard
              board={game.board}
              notes={game.notes}
              selectedCell={selectedCell}
              onSelectCell={setSelectedCell}
            />

            {/* PAUSE 또는 SIGNIN 시 보드를 흰색으로 완전히 가림 (시간도 멈춤) */}
            {(viewMode === "pause" || viewMode === "SIGNIN") && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 100,
                  border: "2px solid #000",
                }}
              >
                {viewMode === "pause" ? (
                  <>
                    <h3>일시정지됨</h3>
                    <button
                      onClick={() => setViewMode("game")}
                      style={{ marginBottom: "10px", width: "120px" }}
                    >
                      계속하기
                    </button>
                    <button
                      onClick={() => {
                        setGame(null);
                        setViewMode("menu");
                      }}
                    >
                      나가기
                    </button>
                    <button
                      onClick={() =>
                        setGame((prev) => ({ ...prev, status: "COMPLETED" }))
                      }
                      style={{ backgroundColor: "red", color: "white" }}
                    >
                      강제 승리(테스트용)
                    </button>
                  </>
                ) : (
                  /* 게임 도중 로그인 시도 시 뜨는 오버레이 */
                  <div style={{ padding: "20px", textAlign: "center" }}>
                    <h3>로그인 / 회원가입</h3>
                    <p>
                      여기에 로그인 폼 연동 (로그인 시 게임이 정지된 상태로
                      유지됨)
                    </p>
                    <button onClick={() => setViewMode("game")}>
                      돌아가기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {game && game.status === "COMPLETED" && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(255, 255, 255, 0.98)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 150,
                border: "3px solid #4CAF50",
                borderRadius: "8px",
              }}
            >
              <h2 style={{ color: "#4CAF50" }}>🎉 MISSION COMPLETE!</h2>
              <div
                style={{
                  margin: "20px 0",
                  textAlign: "center",
                  fontSize: "18px",
                }}
              >
                <p>
                  <strong>난이도:</strong> {game.difficulty} 단계
                </p>
                <p>
                  <strong>소요 시간:</strong> {formatTime(seconds)}
                </p>
                {/* 로그인 여부에 따른 조건부 버튼 */}
                {localStorage.getItem("token") ? (
                  <p style={{ color: "#666", fontSize: "14px" }}>
                    ✅ 기록이 서버에 저장되었습니다.
                  </p>
                ) : (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "10px",
                      backgroundColor: "#fff9c4",
                      borderRadius: "5px",
                    }}
                  >
                    <p
                      style={{
                        color: "#e91e63",
                        fontSize: "14px",
                        marginBottom: "8px",
                      }}
                    >
                      💡 지금 로그인하면 이 기록을 랭킹에 등록할 수 있습니다!
                    </p>
                    <button
                      onClick={() => setViewMode("SIGNIN")}
                      style={{
                        padding: "5px 15px",
                        backgroundColor: "#e91e63",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      로그인하고 기록 저장하기
                    </button>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <button
                  onClick={startGame}
                  style={{
                    width: "200px",
                    padding: "10px",
                    backgroundColor: "#4CAF50",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  다시 하기 (같은 난이도)
                </button>
                <button
                  onClick={() => {
                    setGame(null);
                    setViewMode("menu");
                  }}
                  style={{
                    width: "200px",
                    padding: "10px",
                    backgroundColor: "#2196F3",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  난이도 변경하기
                </button>
                <button
                  onClick={() => {
                    setGame(null);
                    setSeconds(0);
                    setViewMode("menu");
                  }}
                  style={{
                    width: "200px",
                    padding: "10px",
                    backgroundColor: "#f44336",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  종료하기
                </button>
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: "16px",
              opacity: viewMode === "game" ? 1 : 0.2,
              pointerEvents: viewMode === "game" ? "auto" : "none",
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                style={{ width: "40px", height: "40px" }}
                onClick={() =>
                  isNoteMode
                    ? toggleNote(selectedCell?.row, selectedCell?.col, n)
                    : placeNumber(selectedCell?.row, selectedCell?.col, n)
                }
              >
                {n}
              </button>
            ))}
            <button
              onClick={() =>
                placeNumber(selectedCell?.row, selectedCell?.col, 0)
              }
            >
              ERASE
            </button>
          </div>
        </>
      )}
      {/* 4. 로그인/회원가입 통합 모달 */}
      {viewMode === "SIGNIN" && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "40px",
              borderRadius: "12px",
              width: "320px",
              textAlign: "center",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            }}
          >
            {/* 로그인/회원가입 타이틀 분기 */}
            <h2>{isLoginView ? "Sign In" : "Sign Up"}</h2>
            <p
              style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}
            >
              {game?.status === "COMPLETED"
                ? "🏆 기록을 저장하려면 로그인하세요!"
                : "스도쿠의 모든 기능을 즐겨보세요."}
            </p>

            {/* 입력 폼 영역 */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <input
                type="email"
                placeholder="이메일 (ID)"
                style={{
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
              <input
                type="password"
                placeholder="비밀번호"
                style={{
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
              {!isLoginView && (
                <input
                  type="password"
                  placeholder="비밀번호 확인"
                  style={{
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              )}

              {/* 실행 버튼 */}
              <button
                onClick={() => {
                  // 여기에 실제 API 호출 로직 (onLoginSuccess 등) 연결
                  alert(isLoginView ? "로그인 시도" : "회원가입 시도");
                }}
                style={{
                  padding: "12px",
                  backgroundColor: "#4CAF50",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {isLoginView ? "로그인" : "가입하기"}
              </button>
            </div>

            {/* 모드 전환 링크 */}
            <div style={{ marginTop: "20px", fontSize: "14px" }}>
              {isLoginView ? (
                <p>
                  계정이 없으신가요?{" "}
                  <span
                    onClick={() => setIsLoginView(false)}
                    style={{
                      color: "#2196F3",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    회원가입
                  </span>
                </p>
              ) : (
                <p>
                  이미 계정이 있나요?{" "}
                  <span
                    onClick={() => setIsLoginView(true)}
                    style={{
                      color: "#2196F3",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    로그인
                  </span>
                </p>
              )}
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={() => setViewMode(game ? "game" : "menu")}
              style={{
                marginTop: "15px",
                background: "none",
                border: "none",
                color: "#999",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              나중에 하기
            </button>
          </div>
        </div>
      )}

      <p style={{ marginTop: "20px" }}>{statusMessage}</p>
    </div>
  );
}

export default App;
