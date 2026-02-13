import React from "react";

const NumberPad = ({
  viewMode,
  isNoteMode,
  onInput,
  onErase,
  selectedCell,
  isPlacing,
}) => (
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
        style={{ width: "40px", height: "40px", marginRight: "4px" }}
        disabled={!selectedCell || isPlacing}
        onClick={() => onInput(selectedCell.row, selectedCell.col, n)}
      >
        {n}
      </button>
    ))}
    <button
      disabled={!selectedCell || isPlacing}
      onClick={() => onErase(selectedCell.row, selectedCell.col, 0)}
      style={{ height: "40px", marginLeft: "8px" }}
    >
      ERASE
    </button>
  </div>
);

export default NumberPad;
