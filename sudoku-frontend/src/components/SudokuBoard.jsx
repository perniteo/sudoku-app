function SudokuBoard({ board, onPlace, selectedCell, onSelectCell }) {
  return (
    <div
      className="board"
      style={{
        marginTop: "20px",
        display: "inline-block",
      }}
    >
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                boxSizing: "border-box",
                // 3x3 박스 구분 + 외곽 테두리 두껍게
                borderTop:
                  rIdx === 0 || rIdx % 3 === 0
                    ? "2px solid #000"
                    : "1px solid #333",
                borderLeft:
                  cIdx === 0 || cIdx % 3 === 0
                    ? "2px solid #000"
                    : "1px solid #333",
                borderRight:
                  cIdx === 8 ? "2px solid #000" : "1px solid #333",
                borderBottom:
                  rIdx === 8 ? "2px solid #000" : "1px solid #333",
                backgroundColor:
                  selectedCell?.row === rIdx && selectedCell?.col === cIdx
                    ? "#cde7ff"
                    : "#fff",
                cursor: "pointer",
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
