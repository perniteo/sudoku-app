import React, { useState, useEffect, useRef } from "react";

const ChatWindow = ({ messages, onSendMessage, myId, height = "400px" }) => {
  const [chatInput, setChatInput] = useState("");
  const scrollRef = useRef(null);

  // 🎯 새 메시지가 오면 자동으로 스크롤을 최하단으로 내림
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    onSendMessage(chatInput);
    setChatInput(""); // 입력창 초기화
  };

  return (
    <div style={{ ...styles.chatContainer, height }}>
      <div style={styles.chatHeader}>💬 LIVE CHAT</div>

      <div style={styles.chatBox} ref={scrollRef}>
        {messages.map((msg, i) => {
          // 🎯 나(myId)와 메시지 작성자(userId) 비교
          const isMe = msg.userId === myId;

          return (
            <div key={i} style={isMe ? styles.myMsgRow : styles.otherMsgRow}>
              <div style={isMe ? styles.myMsgBox : styles.otherMsgBox}>
                {!isMe && <div style={styles.senderName}>{msg.sender}</div>}
                <div style={styles.content}>{msg.content}</div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div style={styles.empty}>채팅을 시작해보세요!</div>
        )}
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
  );
};

const styles = {
  chatContainer: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#fff",
    borderRadius: "16px",
    border: "1px solid #eee",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  chatHeader: {
    padding: "12px 15px",
    backgroundColor: "#f8f9fa",
    borderBottom: "1px solid #eee",
    fontSize: "12px",
    fontWeight: "800",
    color: "#673AB7",
    letterSpacing: "0.5px",
  },
  chatBox: {
    flex: 1,
    overflowY: "auto",
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    backgroundColor: "#fafafa",
  },
  // 🎯 말풍선 구분 스타일
  myMsgRow: { display: "flex", justifyContent: "flex-end" },
  otherMsgRow: { display: "flex", justifyContent: "flex-start" },
  myMsgBox: {
    backgroundColor: "#673AB7",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "15px 15px 2px 15px",
    maxWidth: "80%",
    boxShadow: "0 2px 4px rgba(103, 58, 183, 0.2)",
  },
  otherMsgBox: {
    backgroundColor: "#fff",
    color: "#333",
    padding: "8px 12px",
    borderRadius: "15px 15px 15px 2px",
    maxWidth: "80%",
    border: "1px solid #ddd",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },
  senderName: {
    fontSize: "10px",
    color: "#888",
    marginBottom: "4px",
    fontWeight: "bold",
  },
  content: { fontSize: "14px", lineHeight: "1.4", wordBreak: "break-all" },
  inputGroup: {
    display: "flex",
    padding: "12px",
    backgroundColor: "#fff",
    borderTop: "1px solid #eee",
    gap: "8px",
  },
  input: {
    flex: 1,
    padding: "10px 15px",
    borderRadius: "20px",
    border: "1px solid #ddd",
    fontSize: "14px",
    outline: "none",
  },
  sendBtn: {
    padding: "0 18px",
    backgroundColor: "#673AB7",
    color: "#fff",
    border: "none",
    borderRadius: "20px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  empty: {
    textAlign: "center",
    color: "#ccc",
    marginTop: "20px",
    fontSize: "12px",
  },
};

export default ChatWindow;
