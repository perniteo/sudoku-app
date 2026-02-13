import React from "react";

const MainMenu = ({
  difficulty,
  setDifficulty,
  onStart,
  onContinue,
  hasSavedGame,
  token,
}) => (
  <div
    style={{ border: "1px solid #eee", padding: "20px", borderRadius: "8px" }}
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
      <button onClick={onStart} style={{ marginLeft: "10px" }}>
        새 게임 시작
      </button>
    </div>
    <button
      onClick={onContinue}
      disabled={!token || !hasSavedGame}
      style={{
        backgroundColor: token && hasSavedGame ? "#4CAF50" : "#ccc",
        color: "white",
        padding: "10px 20px",
        border: "none",
        cursor: token && hasSavedGame ? "pointer" : "not-allowed",
      }}
    >
      이어서 하기
    </button>
  </div>
);

export default MainMenu;
