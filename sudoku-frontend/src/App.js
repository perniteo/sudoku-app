import { useState } from "react";

import SudokuBoard from "./components/SudokuBoard";

function App() {
  const [status, setStatus] = useState("아직 안 눌림");
  const [gameData, setGameData] = useState(null);

  const checkBackend = async () => {
    setStatus("눌림, 응답 대기중...");
    try {
      await fetch("/api/health2")
        .then((res) => res.json())
        .then((data) => setStatus(data.status));
    } catch (error) {
      setStatus("에러 발생: " + error.message);
    }
  };

  const checkPostResponse = async () => {
    setStatus("POST 요청 눌림, 응답 대기중...");
    try {
      await fetch("/api/game/start", {
        method: "POST",
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Backend response:", data);
          setGameData(data);
          setStatus(data.status);
        });
    } catch (error) {
      setStatus("에러 발생: " + error.message);
    }
  };
  return (
    <div style={{ padding: "20px" }}>
      <h1>React Button Fetch Test</h1>
      <button onClick={checkBackend}>Check Backend Status</button>
      <button onClick={checkPostResponse} style={{ marginLeft: "10px" }}>
        Send POST Request
      </button>
      {gameData && gameData.board && (
        <div>
          <h2>Sudoku Board</h2>
          <SudokuBoard board={gameData.board} />
        </div>
      )}
      <p>Backend status: {status}</p>
    </div>
  );
}

export default App;
