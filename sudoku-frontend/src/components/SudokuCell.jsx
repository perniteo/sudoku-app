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
          fontSize: cell !== 0 ? "20px" : "10px",
          boxSizing: "border-box",
          cursor: "pointer",
          // 3x3 박스 구분선 로직
          borderTop: rIdx % 3 === 0 ? "2px solid #000" : "1px solid #333",
          borderLeft: cIdx % 3 === 0 ? "2px solid #000" : "1px solid #333",
          borderRight: cIdx === 8 ? "2px solid #000" : "1px solid #333",
          borderBottom: rIdx === 8 ? "2px solid #000" : "1px solid #333",
          backgroundColor: isSelected ? "#cde7ff" : "#fff",
          color: cell !== 0 ? "#000" : "#666",
          position: "relative",
          userSelect: "none", // 텍스트 드래그 방지
        }}
      >
        {/* 숫자가 있는 경우 크게 표시 */}
        {cell !== 0 ? (
          cell
        ) : (
          /* 숫자가 없는 경우 메모(Notes) 3x3 격자 표시 */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gridTemplateRows: "1fr 1fr 1fr",
              width: "100%",
              height: "100%",
              padding: "2px",
              pointerEvents: "none", // 내부 격자가 클릭 이벤트를 방해하지 않도록 함
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <div
                key={n}
                style={{
                  textAlign: "center",
                  lineHeight: "12px", // 메모 숫자 높이 조절
                  fontSize: "9px",
                  // safeNotes에 숫자가 포함되어 있으면 보여주고, 아니면 숨김
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
