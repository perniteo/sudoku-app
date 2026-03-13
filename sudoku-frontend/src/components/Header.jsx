import React from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../services/AuthService"; // 🎯 서비스 직접 임포트

const Header = ({ token, setToken, onLoginClick, onShowRecords }) => {
  const navigate = useNavigate();
  // 🎯 로그아웃 로직 분리
  const handleLogout = async () => {
    try {
      await AuthService.signOut(); // 서버에 쿠키 삭제 요청
      setToken(null); // 상위 토큰 상태 비우기
      localStorage.removeItem("accessToken");
      alert("로그아웃 되었습니다.");
    } catch (err) {
      console.error("로그아웃 실패:", err);
      // 에러가 나도 유저 입장에선 로그아웃 된 것처럼 보이게 처리
      setToken(null);
      localStorage.removeItem("accessToken");
    }
  };

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
            <button
              onClick={() => navigate("/records")}
              style={styles.recordBtn}
            >
              📊 내 기록
            </button>
            <span style={styles.userText}>ONLINE</span>
            {/* 🎯 아까 만든 handleLogout 연결 */}
            <button onClick={handleLogout} style={styles.logoutBtn}>
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
