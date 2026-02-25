import React, { useState, useEffect, useRef } from "react";

// 1. 흔들리는 애니메이션 정의
const shakeKeyframes = `
  @keyframes shake {
    0% { transform: translateX(0); background-color: #ffcfcf; }
    25% { transform: translateX(-4px); }
    50% { transform: translateX(4px); }
    75% { transform: translateX(-4px); }
    100% { transform: translateX(0); background-color: #fff; }
  }
`;

const SudokuCell = React.memo(
  ({ rIdx, cIdx, cell, notes, isSelected, onClick }) => {
    const safeNotes = Array.isArray(notes) ? notes : [];
    const [isWrong, setIsWrong] = useState(false);
    const prevCell = useRef(cell); // 🎯 이전 값을 기억함

    // 🎯 [핵심 로직] 이전 값이 0이 아니었는데 지금 0이 됐다면 = '틀려서 지워짐'
    useEffect(() => {
      if (prevCell.current !== 0 && cell === 0) {
        setIsWrong(true);
        const timer = setTimeout(() => setIsWrong(false), 500); // 0.5초 뒤 초기화
        return () => clearTimeout(timer);
      }
      prevCell.current = cell; // 현재 값을 다음 비교를 위해 저장
    }, [cell]);

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
          borderTop: rIdx % 3 === 0 ? "2px solid #000" : "1px solid #333",
          borderLeft: cIdx % 3 === 0 ? "2px solid #000" : "1px solid #333",
          borderRight: cIdx === 8 ? "2px solid #000" : "1px solid #333",
          borderBottom: rIdx === 8 ? "2px solid #000" : "1px solid #333",

          // 🎯 배경색: 선택(파랑) -> 틀림(순간 빨강) -> 평소(흰색)
          backgroundColor: isSelected
            ? "#cde7ff"
            : isWrong
              ? "#ffcfcf"
              : "#fff",

          // 🎯 애니메이션: 진짜 틀렸을 때만(isWrong) 실행
          animation: isWrong ? "shake 0.4s ease-in-out" : "none",

          transition: "background-color 0.2s",
          color: "#000",
          position: "relative",
          userSelect: "none",
        }}
      >
        <style>{shakeKeyframes}</style>

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
