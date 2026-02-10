import SudokuCell from "./SudokuCell";

function SudokuBoard({ board, notes, selectedCell, onSelectCell }) {
  return (
    <div
      className="board"
      style={{ marginTop: "20px", display: "inline-block" }}
    >
      {board.map((row, rIdx) => (
        <div key={rIdx} style={{ display: "flex" }}>
          {row.map((cell, cIdx) => (
            <SudokuCell
              key={`${rIdx}-${cIdx}`}
              rIdx={rIdx}
              cIdx={cIdx}
              cell={cell}
              // App.js에서 관리하는 2차원 배열 notes[rIdx][cIdx] 전달
              notes={notes?.[rIdx]?.[cIdx] || []}
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
