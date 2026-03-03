import React, { useState, useEffect, useRef } from "react";

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
  ({ rIdx, cIdx, cell, notes, userId, isFixed, isSelected, onClick, myId }) => {
    const [isWrong, setIsWrong] = useState(false);
    const prevCell = useRef(cell);

    useEffect(() => {
      // 🎯 숫자가 틀려서 서버가 0으로 돌려보냈을 때만 흔들림
      if (prevCell.current !== 0 && cell === 0) {
        setIsWrong(true);
        const timer = setTimeout(() => setIsWrong(false), 500);
        return () => clearTimeout(timer);
      }
      prevCell.current = cell;
    }, [cell]);

    const getTextColor = () => {
      // console.log("나의 ID:", myId, "셀 ID:", userId);
      // 🎯 1. 진짜 초기 힌트 (고정되어 있고, 누가 썼는지 정보가 없음)
      if (isFixed && !userId) {
        return "#000";
      }

      // 2. 숫자가 0(빈칸)이면 색상 무의미
      if (cell === 0) return "#000";

      // 🎯 3. 유저가 입력해서 맞춘 정답 (isFixed가 true여도 여기로 옴)
      // 내 ID와 비교해서 보라색(#673AB7) 또는 파란색(#2196F3)
      if (userId === myId) return "#673AB7"; // 내꺼 (보라)
      return "#2196F3"; // 남이 맞춘 거 (파랑)
    };

    return (
      <div
        onClick={() => {
          console.log(`🖱️ 칸 클릭됨: ${rIdx}, ${cIdx}`);
          onClick({ row: rIdx, col: cIdx });
        }}
        style={{
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: cell !== 0 ? "18px" : "9px",
          fontWeight: isFixed ? "bold" : "500",
          cursor: "pointer",
          borderTop: rIdx % 3 === 0 ? "2px solid #000" : "1px solid #333",
          borderLeft: cIdx % 3 === 0 ? "2px solid #000" : "1px solid #333",
          borderRight: cIdx === 8 ? "2px solid #000" : "1px solid #333",
          borderBottom: rIdx === 8 ? "2px solid #000" : "1px solid #333",
          backgroundColor: isSelected
            ? "#cde7ff"
            : isWrong
              ? "#ffcfcf"
              : "#fff",
          animation: isWrong ? "shake 0.4s ease-in-out" : "none",
          color: getTextColor(), // 🎯 색상 적용
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
              color: "#aaa",
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <div
                key={n}
                style={{
                  textAlign: "center",
                  fontSize: "9px",
                  visibility: notes?.includes(n) ? "visible" : "hidden",
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
