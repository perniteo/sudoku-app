package io.github.perniteo.common.listener;

import io.github.perniteo.sudoku.service.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

  private final RoomService roomService;

  // 🎯 1. 연결 시점 (입장 메시지 등을 쏠 때 사용 가능)
  @EventListener
  public void handleWebSocketConnectListener(SessionConnectEvent event) {
    log.info("새로운 웹소켓 연결 발생");
  }

  // 🎯 2. 연결 종료 시점 (브라우저 종료, 네트워크 단절 등)
  @EventListener
  public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
    StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

    // 세션에 저장해둔 정보 꺼내기 (연결 시점에 넣어줘야 함)
    String gameId = (String) headerAccessor.getSessionAttributes().get("gameId");
    String roomCode = (String) headerAccessor.getSessionAttributes().get("roomCode");

    if (gameId != null) {
      log.info("유저 퇴장 감지: gameId = {}, roomCode = {}", gameId, roomCode);
      // 🎯 RoomService에서 인원수 줄이고 방 폭파 로직 실행
      roomService.leaveRoom(gameId, roomCode);
    }
  }
}
