import React, { useState } from "react";

const WaitingRoom = ({
  roomInfo,
  chatMessages,
  onSendMessage,
  onUpdateDifficulty,
  onCancel,
  onStartGame,
  isHost,
}) => {
  const [chatInput, setChatInput] = useState("");

  const handleSend = () => {
    if (!chatInput.trim()) return;
    onSendMessage(chatInput);
    setChatInput("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>MULTIPLAYER WAITING ROOM</h3>
        <div style={styles.codeBox}>
          <span style={styles.label}>참여 코드</span>
          <h1 style={styles.codeText}>{roomInfo.roomCode}</h1>
        </div>
      </div>

      <div style={styles.mainLayout}>
        {/* 왼쪽: 설정 구역 */}
        <div style={styles.settingsSection}>
          <h4 style={styles.subTitle}>GAME SETTINGS</h4>
          <div style={styles.row}>
            <label>난이도: </label>
            <select
              value={roomInfo.difficulty}
              onChange={(e) => onUpdateDifficulty(Number(e.target.value))}
              disabled={!isHost}
              style={styles.select}
            >
              {[4, 6, 8, 10].map((l) => (
                <option key={l} value={l}>
                  Level {l}
                </option>
              ))}
            </select>
          </div>
          <p style={styles.infoText}>
            {isHost
              ? "💡 난이도를 선택하고 친구를 기다리세요."
              : "⏳ 방장이 난이도를 조절 중입니다."}
          </p>

          {/* 🎯 방장 전용 시작 버튼 추가 */}
          {isHost && (
            <button onClick={onStartGame} style={styles.startBtn}>
              🎮 GAME START
            </button>
          )}

          <button
            onClick={onCancel}
            style={isHost ? styles.cancelBtnSmall : styles.cancelBtn}
          >
            방 나가기
          </button>
        </div>

        {/* 오른쪽: 실시간 채팅 구역 */}
        <div style={styles.chatSection}>
          <h4 style={styles.subTitle}>CHAT</h4>
          <div style={styles.chatBox}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={styles.chatMsg}>
                <span style={styles.sender}>{msg.sender}:</span> {msg.content}
              </div>
            ))}
          </div>
          <div style={styles.inputGroup}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="메시지 입력..."
              style={styles.input}
            />
            <button onClick={handleSend} style={styles.sendBtn}>
              전송
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    border: "1px solid #ddd",
    padding: "25px",
    borderRadius: "15px",
    backgroundColor: "#fff",
    maxWidth: "700px",
    margin: "0 auto",
  },
  header: { textAlign: "center", marginBottom: "30px" },
  codeBox: {
    backgroundColor: "#f0f4f8",
    padding: "10px",
    borderRadius: "10px",
    display: "inline-block",
  },
  codeText: {
    fontSize: "32px",
    letterSpacing: "5px",
    color: "#673AB7",
    margin: "5px 0",
  },
  mainLayout: {
    display: "flex",
    gap: "30px",
    borderTop: "1px solid #eee",
    paddingTop: "20px",
  },
  settingsSection: { flex: 1, display: "flex", flexDirection: "column" },
  chatSection: { flex: 1.5, display: "flex", flexDirection: "column" },
  subTitle: { fontSize: "12px", color: "#aaa", marginBottom: "15px" },
  chatBox: {
    height: "200px",
    border: "1px solid #eee",
    borderRadius: "8px",
    padding: "10px",
    overflowY: "auto",
    marginBottom: "10px",
    backgroundColor: "#fafafa",
  },
  inputGroup: { display: "flex", gap: "5px" },
  input: {
    flex: 1,
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #ddd",
  },
  sendBtn: {
    padding: "8px 15px",
    backgroundColor: "#673AB7",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  // 🎯 새로 추가된 시작 버튼 스타일
  startBtn: {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "#4CAF50",
    color: "#white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  cancelBtn: {
    marginTop: "30px",
    width: "100%",
    padding: "10px",
    border: "none",
    backgroundColor: "#ff5252",
    color: "#fff",
    borderRadius: "6px",
    cursor: "pointer",
  },
  // 방장일 때 나가는 버튼은 조금 작게 아래로
  cancelBtnSmall: {
    marginTop: "10px",
    width: "100%",
    padding: "8px",
    border: "none",
    backgroundColor: "transparent",
    color: "#bbb",
    fontSize: "13px",
    textDecoration: "underline",
    cursor: "pointer",
  },
  infoText: {
    fontSize: "13px",
    color: "#666",
    marginTop: "10px",
    lineHeight: "1.4",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  select: {
    padding: "5px",
    borderRadius: "4px",
  },
  chatMsg: {
    marginBottom: "5px",
    fontSize: "14px",
  },
  sender: {
    fontWeight: "bold",
    marginRight: "5px",
  },
};

export default WaitingRoom;
