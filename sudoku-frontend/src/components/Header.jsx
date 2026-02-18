import React from "react";

const Header = ({ token, onLoginClick, onLogout, onShowRecords }) => {
  return (
    <div style={styles.headerContainer}>
      <h2 style={styles.logo}>SUDOKU</h2>

      <div style={styles.buttonGroup}>
        {!token ? (
          <button onClick={onLoginClick} style={styles.loginBtn}>
            로그인 / 회원가입
          </button>
        ) : (
          <div style={styles.userInfo}>
            {/* 🎯 기록실 진입 버튼 추가 */}
            <button onClick={onShowRecords} style={styles.recordBtn}>
              📊 내 기록
            </button>
            <span style={styles.userText}>ONLINE</span>
            <button onClick={onLogout} style={styles.logoutBtn}>
              로그아웃
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    padding: "10px 0",
    borderBottom: "1px solid #eee",
  },
  logo: {
    margin: 0,
    fontSize: "24px",
    letterSpacing: "2px",
    color: "#333",
  },
  buttonGroup: {
    textAlign: "right",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  userText: {
    fontSize: "12px",
    color: "#4CAF50",
    fontWeight: "bold",
    backgroundColor: "#e8f5e9",
    padding: "2px 8px",
    borderRadius: "10px",
  },
  loginBtn: {
    padding: "8px 16px",
    backgroundColor: "#2196F3",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  recordBtn: {
    padding: "8px 16px",
    backgroundColor: "#f5f5f5",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "0.2s",
  },
  logoutBtn: {
    padding: "8px 16px",
    backgroundColor: "transparent",
    color: "#888",
    border: "1px solid #ddd",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
  },
};

export default Header;
