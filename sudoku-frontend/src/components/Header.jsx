import React from "react";

const Header = ({ token, onLoginClick, onLogout }) => (
  <div style={{ marginBottom: "20px", textAlign: "right" }}>
    {!token ? (
      <button onClick={onLoginClick}>로그인 / 회원가입</button>
    ) : (
      <span>
        로그인됨 <button onClick={onLogout}>로그아웃</button>
      </span>
    )}
  </div>
);

export default Header;
