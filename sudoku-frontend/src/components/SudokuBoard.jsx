function SudokuBoard({ board }) {
  return (
    <div style={{ marginTop: "20px" }}>
      {board.map((row, rIdx) => (
        <div key={rIdx} style={{ display: "flex" }}>
          {row.map((cell, cIdx) => (
            <div
              key={cIdx}
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
