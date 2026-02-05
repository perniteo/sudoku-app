import { useEffect, useState, useCallback } from "react";
import SudokuBoard from "./components/SudokuBoard";

function App() {
  // game = { id, board, status, life }
  const [game, setGame] = useState(null);
  const [statusMessage, setStatusMessage] = useState("대기중");
  const [difficulty, setDifficulty] = useState(4);

  const [selectedCell, setSelectedCell] = useState(null);

  const [isPlacing, setIsPlacing] = useState(false);

  // 게임 시작: POST /games
  const startGame = async () => {
    setStatusMessage("게임 생성 중...");
    try {
      const res = await fetch("/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          difficulty,
        }),
      });

      const data = await res.json();
      console.log("Game started:", data);

      setGame({
        ...data,
        // 백엔드 초기 응답에 life가 없으므로 기본 3으로 시작
        life: data.life ?? 3,
        difficulty,
      });
      setStatusMessage(data.status);
    } catch (error) {
      setStatusMessage("에러: " + error.message);
    }
  };

  // 숫자 입력: POST /games/{id}/place
  const placeNumber = useCallback(
    async (row, col, value) => {
      console.log("PLACE REQUEST:", { row, col, value });
      if (!game) return;

      setIsPlacing(true);
      setStatusMessage("숫자 입력 중...");

      try {
        const res = await fetch(`/games/${game.gameId}/place`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            row,
            col,
            value,
          }),
        });

        const data = await res.json();
        console.log("Place result:", data);

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
    [game]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCell || isPlacing || !game) return;

      if (e.key >= "1" && e.key <= "9") {
        placeNumber(selectedCell.row, selectedCell.col, parseInt(e.key));
      }

      if (e.key === "0" || e.key === "Backspace" || e.key === "Delete") {
        placeNumber(selectedCell.row, selectedCell.col, 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedCell, isPlacing, game, placeNumber]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Sudoku</h1>

      {!game && (
        <div style={{ marginBottom: "16px" }}>
          <label style={{ marginRight: "8px" }}>
            난이도:
            <select
              style={{ marginLeft: "8px" }}
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
            >
              {[4, 5, 6, 7, 8, 9, 10, 11].map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
          <button onClick={startGame} style={{ marginLeft: "8px" }}>
            게임 시작
          </button>
        </div>
      )}

      {game && (
        <>
          <p>
            상태: {game.status} / life: {game.life ?? 3} / 난이도:{" "}
            {game.difficulty ?? difficulty}
          </p>

          <SudokuBoard
            board={game.board}
            onPlace={placeNumber}
            selectedCell={selectedCell}
            onSelectCell={setSelectedCell}
          />
        </>
      )}
      {game && (
        <div>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              disabled={!selectedCell || isPlacing}
              onClick={() => placeNumber(selectedCell.row, selectedCell.col, n)}
            >
              {n}
            </button>
          ))}

          <button
            disabled={!selectedCell || isPlacing}
            onClick={() => placeNumber(selectedCell.row, selectedCell.col, 0)}
          >
            ERASE
          </button>
        </div>
      )}

      <p>{statusMessage}</p>
    </div>
  );
}

export default App;
