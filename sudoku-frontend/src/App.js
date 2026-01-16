import { useState } from "react";
import SudokuBoard from "./components/SudokuBoard";

function App() {
  // game = { id, board, status, life }
  const [game, setGame] = useState(null);
  const [statusMessage, setStatusMessage] = useState("대기중");

  // 게임 시작: POST /games
  const startGame = async () => {
    setStatusMessage("게임 생성 중...");
    try {
      const res = await fetch("/games", {
        method: "POST",
      });

      const data = await res.json();
      console.log("Game started:", data);

      setGame(data);
      setStatusMessage(data.status);
    } catch (error) {
      setStatusMessage("에러: " + error.message);
    }
  };

  // 숫자 입력: POST /games/{id}/place
  const placeNumber = async (row, col, value) => {
    if (!game) return;

    try {
      const res = await fetch(`/games/${game.id}/place`, {
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
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Sudoku</h1>

      {!game && <button onClick={startGame}>게임 시작</button>}

      {game && (
        <>
          <p>
            상태: {game.status} / life: {game.life}
          </p>

          <SudokuBoard board={game.board} onPlace={placeNumber} />
        </>
      )}

      <p>{statusMessage}</p>
    </div>
  );
}

export default App;
