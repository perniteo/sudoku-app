import React from "react";
import SudokuBoard from "./SudokuBoard";
import GameInfo from "./GameInfo";
import NumberPad from "./NumberPad";
import GameOverlay from "./GameOverlay";

const MultiGameView = ({
  game,
  chatMessages,
  onSendMessage,
  onPlaceNumber,
}) => (
  <div style={{ display: "flex", gap: "20px" }}>
    {/* 왼쪽: 스도쿠 보드 */}
    <div className="game-board-section">
      <SudokuBoard board={game.board} onPlace={onPlaceNumber} />
    </div>

    {/* 오른쪽: 실시간 채팅창 (독립된 영역) */}
    <div
      className="chat-section"
      style={{ width: "300px", border: "1px solid #ccc" }}
    >
      <div
        className="chat-messages"
        style={{ height: "400px", overflowY: "scroll" }}
      >
        {chatMessages.map((msg, i) => (
          <div key={i}>
            <b>{msg.sender}:</b> {msg.content}
          </div>
        ))}
      </div>
      <input
        onKeyDown={(e) => e.key === "Enter" && onSendMessage(e.target.value)}
      />
    </div>
  </div>
);
