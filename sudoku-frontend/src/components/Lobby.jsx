import React from "react";

const Lobby = ({ rooms, onCreateRoom, onJoinRoom }) => (
  <div className="lobby-container">
    <h2>멀티플레이 로비</h2>
    <button onClick={() => onCreateRoom(4)}>방 만들기 (보통)</button>
    <div className="room-list">
      {rooms.map((room) => (
        <div key={room.roomCode} className="room-item">
          <span>
            코드: {room.roomCode} | 난이도: {room.difficulty}
          </span>
          <span>인원: {room.currentPlayers}/2</span>
          <button onClick={() => onJoinRoom(room.roomCode)}>참가</button>
        </div>
      ))}
    </div>
  </div>
);
