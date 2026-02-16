import React from "react";

const MainMenu = ({
  difficulty,
  setDifficulty,
  onStart,
  onContinue,
  hasSavedGame,
  savedGameInfo, // 👈 App.js에서 추가한 상태
  formatTime, // 👈 시간 포맷 함수
}) => {
  const canContinue = hasSavedGame && savedGameInfo;

  // 하트 렌더링 함수: 남은 건 빨간 하트, 깎인 건 깨진 하트
  const renderLife = (life) => {
    const maxLife = 3;
    const filledHearts = "❤️".repeat(life);
    const brokenHearts = "💔".repeat(maxLife - life); // 👈 깎인 만큼 깨진 하트 표시
    return filledHearts + brokenHearts;
  };

  return (
    <div style={styles.container}>
      {/* 1. 새 게임 설정 구역 */}
      <div style={styles.section}>
        <h3 style={styles.title}>새 게임 설정</h3>
        <div style={styles.row}>
          <label>난이도: </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            style={styles.select}
          >
            {[4, 5, 6, 7, 8, 9, 10, 11].map((l) => (
              <option key={l} value={l}>
                Level {l}
              </option>
            ))}
          </select>
          <button onClick={onStart} style={styles.startBtn}>
            시작하기
          </button>
        </div>
      </div>

      {/* 2. 이어하기 구역 (정보 노출) */}
      <div style={styles.section}>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          style={{
            ...styles.continueBtn,
            backgroundColor: canContinue ? "#4CAF50" : "#ccc",
            cursor: canContinue ? "pointer" : "not-allowed",
          }}
        >
          {canContinue ? (
            <div style={styles.infoWrapper}>
              <div style={styles.btnLabel}>이어서 하기</div>
              <div style={styles.stats}>
                <span>Lv.{savedGameInfo.difficulty}</span>
                <span style={styles.divider}>|</span>
                <span>⏱ {formatTime(savedGameInfo.elapsedTime)}</span>
                <span style={styles.divider}>|</span>
                {/* 🎯 하트 UI 적용 */}
                <span style={styles.heartGroup}>
                  {renderLife(savedGameInfo.life)}
                </span>
              </div>
            </div>
          ) : (
            <span style={styles.disabledText}>진행 중인 게임 없음</span>
          )}
        </button>
      </div>
    </div>
  );
};

// 🎨 하단 스타일 정의
const styles = {
  container: {
    border: "1px solid #ddd",
    padding: "25px",
    borderRadius: "15px",
    backgroundColor: "#fff",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    maxWidth: "400px",
    margin: "0 auto",
  },
  section: {
    marginBottom: "25px",
  },
  title: {
    fontSize: "12px",
    color: "#888",
    letterSpacing: "1px",
    marginBottom: "12px",
    fontWeight: "bold",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
  },
  select: {
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    outline: "none",
  },
  startBtn: {
    padding: "8px 20px",
    backgroundColor: "#2196F3",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    flex: 1,
  },
  continueBtn: {
    width: "100%",
    padding: "20px",
    color: "white",
    border: "none",
    borderRadius: "12px",
    transition: "transform 0.1s, background-color 0.2s",
  },
  infoWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  btnLabel: {
    fontSize: "18px",
    fontWeight: "bold",
    letterSpacing: "0.5px",
  },
  stats: {
    fontSize: "14px",
    opacity: 0.95,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
  },
  heartGroup: {
    letterSpacing: "2px",
    fontSize: "16px",
  },
  divider: {
    opacity: 0.3,
  },
  disabledText: {
    fontSize: "15px",
    fontWeight: "500",
    color: "#eee",
  },
};

export default MainMenu;
