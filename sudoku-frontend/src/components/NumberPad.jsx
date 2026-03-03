// components/NumberPad.jsx
const NumberPad = ({
  isNoteMode,
  onInput,
  onErase,
  selectedCell,
  isPlacing,
  viewMode,
}) => (
  <div
    style={{
      marginTop: "16px",
      // 🎯 게임 중(PLAYING)일 때만 100% 밝게, 아니면 흐리게
      opacity: viewMode === "game" ? 1 : 0.5,
      pointerEvents: viewMode === "game" ? "auto" : "none",
    }}
  >
    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
      <button
        key={n}
        style={{
          width: "40px",
          height: "40px",
          marginRight: "4px",
          cursor: "pointer",
        }}
        disabled={!selectedCell || isPlacing || viewMode !== "game"}
        onClick={() => onInput(selectedCell.row, selectedCell.col, n)}
      >
        {n}
      </button>
    ))}
    <button
      disabled={!selectedCell || isPlacing || viewMode !== "game"}
      onClick={() => onErase(selectedCell.row, selectedCell.col)}
      style={{ height: "40px", marginLeft: "8px", cursor: "pointer" }}
    >
      ERASE
    </button>
  </div>
);

export default NumberPad;
