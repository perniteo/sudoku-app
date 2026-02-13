import React from "react";

const GameInfo = ({
  game,
  formatTime,
  seconds,
  isNoteMode,
  onToggleNote,
  onPause,
}) => (
  <div style={{ marginBottom: "10px" }}>
    <p>
      상태: {game.status} / 목숨: {game.life} / 난이도: {game.difficulty}
    </p>
    <h2 style={{ fontFamily: "monospace" }}>{formatTime(seconds)}</h2>
    <button
      onClick={onToggleNote}
      style={{
        padding: "8px 16px",
        backgroundColor: isNoteMode ? "#ffeb3b" : "#eee",
        marginRight: "10px",
      }}
    >
      메모 모드: {isNoteMode ? "ON" : "OFF"} (N)
    </button>
    <button onClick={onPause} style={{ padding: "8px 16px" }}>
      PAUSE
    </button>
  </div>
);

export default GameInfo;
