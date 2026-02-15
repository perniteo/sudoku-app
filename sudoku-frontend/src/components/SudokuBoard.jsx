import React from "react";
import SudokuCell from "./SudokuCell";

function SudokuBoard({ board, notes, selectedCell, onSelectCell }) {
  return (
    <div
      className="board"
      style={{
        marginTop: "20px",
        display: "inline-block",
        backgroundColor: "#000", // 구분선을 더 선명하게 하기 위한 배경
        padding: "1px",
      }}
    >
      {board.map((row, rIdx) => (
        <div key={rIdx} style={{ display: "flex" }}>
          {row.map((cell, cIdx) => (
            <SudokuCell
              key={`${rIdx}-${cIdx}`}
              rIdx={rIdx}
              cIdx={cIdx}
              cell={cell}
              notes={notes ? notes[rIdx][cIdx] : []}
              isSelected={
                selectedCell?.row === rIdx && selectedCell?.col === cIdx
              }
              onClick={onSelectCell}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default SudokuBoard;
