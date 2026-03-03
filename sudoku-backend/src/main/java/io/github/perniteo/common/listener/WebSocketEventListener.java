package io.github.perniteo.common.listener;

import io.github.perniteo.sudoku.service.RoomService;
import java.util.Map;
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

    // 🎯 인터셉터에서 넣어둔 속성들 꺼내기
    Map<String, Object> attributes = headerAccessor.getSessionAttributes();
    if (attributes != null) {
      String userId = (String) attributes.get("userId");
      String roomCode = (String) attributes.get("roomCode");
      String gameId = (String) attributes.get("gameId");

      if (userId != null && roomCode != null) {
        // 🎯 Redis Set에서 유저 제거 (인원수 자동 감소)
        roomService.leaveRoom(gameId, roomCode, userId);
        System.out.println("🏃 유저 퇴장 처리 완료: " + userId);
      }
    }
  }
}
