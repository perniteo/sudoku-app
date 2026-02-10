package io.github.perniteo.auth.filter;

import io.github.perniteo.auth.provider.JwtProvider;
import jakarta.persistence.Column;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtProvider jwtProvider;

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    // 1. 헤더에서 "Authorization: Bearer <토큰>" 꺼내기
    String bearerToken = request.getHeader("Authorization");

    if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
      String token = bearerToken.substring(7);

      // 2. 토큰이 유효한지 확인 (이거 Provider에 곧 만들게요)
      if (jwtProvider.validateToken(token)) {
        String email = jwtProvider.getEmail(token);

        // 3. 스프링 시큐리티한테 "이 유저 인증됐어!"라고 알려주기
        UsernamePasswordAuthenticationToken auth =
            new UsernamePasswordAuthenticationToken(email, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
      }
    }
    filterChain.doFilter(request, response); // 다음 단계로 진행
  }


}
