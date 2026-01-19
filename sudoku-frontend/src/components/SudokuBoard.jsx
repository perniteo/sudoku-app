function SudokuBoard({ board, onPlace, selectedCell, onSelectCell }) {
  return (
    <div className="board" style={{ marginTop: "20px" }}>
      {board.map((row, rIdx) => (
        <div key={rIdx} style={{ display: "flex" }}>
          {row.map((cell, cIdx) => (
            <div
              key={`${rIdx}-${cIdx}`}
              className={`cell ${
                selectedCell?.row === rIdx && selectedCell?.col === cIdx
                  ? "selected"
                  : ""
              }`}
              onClick={() => onSelectCell({ row: rIdx, col: cIdx })}
              style={{
                width: "32px",
                height: "32px",
                border: "1px solid #333",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
              }}
            >
              {cell === 0 ? "" : cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default SudokuBoard;
