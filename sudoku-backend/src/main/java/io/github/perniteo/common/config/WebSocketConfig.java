package io.github.perniteo.common.config;

import java.util.Map;
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
              ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;
              // 🎯 URL 쿼리 파라미터에서 gameId와 roomCode를 추출해서 세션 속성에 저장
              String gameId = servletRequest.getServletRequest().getParameter("gameId");
              String roomCode = servletRequest.getServletRequest().getParameter("roomCode");

              attributes.put("gameId", gameId);
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
