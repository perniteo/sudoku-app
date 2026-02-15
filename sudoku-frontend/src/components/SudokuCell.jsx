import React from "react";

const SudokuCell = React.memo(
  ({ rIdx, cIdx, cell, notes, isSelected, onClick }) => {
    // 1. 방어 코드: notes가 undefined나 null로 들어와도 에러 안 나게 빈 배열로 초기화
    const safeNotes = Array.isArray(notes) ? notes : [];

    return (
      <div
        onClick={() => onClick({ row: rIdx, col: cIdx })}
        style={{
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: cell !== 0 ? "14px" : "8px",
          boxSizing: "border-box",
          cursor: "pointer",
          // 기존 3x3 구분선 로직 그대로 유지
          borderTop: rIdx % 3 === 0 ? "2px solid #000" : "1px solid #333",
          borderLeft: cIdx % 3 === 0 ? "2px solid #000" : "1px solid #333",
          borderRight: cIdx === 8 ? "2px solid #000" : "1px solid #333",
          borderBottom: rIdx === 8 ? "2px solid #000" : "1px solid #333",
          backgroundColor: isSelected ? "#cde7ff" : "#fff",
          color: "#000",
          position: "relative",
          userSelect: "none",
        }}
      >
        {cell !== 0 ? (
          cell
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              width: "100%",
              height: "100%",
              padding: "1px",
              pointerEvents: "none",
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <div
                key={n}
                style={{
                  textAlign: "center",
                  fontSize: "9px",
                  lineHeight: "10px",
                  visibility: safeNotes.includes(n) ? "visible" : "hidden",
                }}
              >
                {n}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

export default SudokuCell;
