import React from "react";
import SudokuCell from "./SudokuCell";

// 🎯 myId(내 아이디)를 props로 추가로 받아야 함
function SudokuBoard({ board, notes, selectedCell, onSelectCell, myId }) {
  return (
    <div
      className="board"
      style={{
        marginTop: "20px",
        display: "inline-block",
        backgroundColor: "#000",
        padding: "1px",
      }}
    >
      {board.map((row, rIdx) => (
        <div key={rIdx} style={{ display: "flex" }}>
          {row.map((cellData, cIdx) => {
            // 🎯 만약 board 데이터가 [ {v:7, i:"user:..", f:true}, ... ] 형태라면
            // cellData.v (값), cellData.i (작성자), cellData.f (고정여부)를 추출
            const value = typeof cellData === "object" ? cellData.v : cellData;
            const userId = cellData?.i || null;
            const isFixed = cellData?.f || false;

            return (
              <SudokuCell
                key={`${rIdx}-${cIdx}`}
                rIdx={rIdx}
                cIdx={cIdx}
                cell={value} // 🎯 숫자 값만 전달
                userId={userId} // 🎯 작성자 ID 전달
                isFixed={isFixed} // 🎯 고정 여부 전달
                myId={myId} // 🎯 내 ID 전달 (비교용)
                notes={notes ? notes[rIdx][cIdx] : []}
                isSelected={
                  selectedCell?.row === rIdx && selectedCell?.col === cIdx
                }
                onClick={onSelectCell}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default SudokuBoard;
