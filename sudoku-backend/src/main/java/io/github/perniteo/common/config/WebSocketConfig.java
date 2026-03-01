package io.github.perniteo.common.config;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.UUID;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;

@Configuration
@EnableWebSocketMessageBroker // STOMP 메시지 브로커
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {


  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry.addEndpoint("/ws-stomp")
        .setAllowedOriginPatterns("*")
        // 🎯 핸드쉐이크 시점에 세션 속성을 복사하는 인터셉터 추가
        .addInterceptors(new HttpSessionHandshakeInterceptor() {
          @Override
          public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
              WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
            if (request instanceof ServletServerHttpRequest) {
              HttpServletRequest servletRequest = ((ServletServerHttpRequest) request).getServletRequest();

              // 🎯 직접 찍어보기
              String gameId = servletRequest.getParameter("gameId");
              System.out.println("🚀 [DEBUG] Received gameId: " + gameId);
              // 👆 여기서 null이 찍히면 프론트가 안 보낸 거임!

              // 🎯 NPE 방어 로직 (null이면 저장 안 함)
              if (gameId != null && !gameId.trim().isEmpty()) {
                attributes.put("gameId", gameId);
              } else {
                // 임시로 랜덤 ID라도 넣어보고 터지는지 확인
                attributes.put("gameId", "UNKNOWN_" + UUID.randomUUID());
              }

              String roomCode = servletRequest.getParameter("roomCode");
              attributes.put("roomCode", roomCode);
            }
            return true;
          }
        })
        .withSockJS();
  }

  @Override
  public void configureMessageBroker(MessageBrokerRegistry registry) {
    // 🎯 서버가 클라이언트에게 메시지를 보낼 때 (구독 주소)
    // 클라이언트는 /topic/game/{id} 등을 구독하게 됨
    registry.enableSimpleBroker("/topic", "/queue");

    // 🎯 클라이언트가 서버로 메시지를 보낼 때 (발행 주소)
    // 클라이언트는 /multi/game/place 등으로 메시지를 보냄
    // 전역 접두사
    registry.setApplicationDestinationPrefixes("/multi");
  }
}
