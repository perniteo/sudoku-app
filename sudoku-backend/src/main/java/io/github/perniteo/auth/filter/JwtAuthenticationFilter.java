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

    String bearerToken = request.getHeader("Authorization");

    // 1. 토큰이 아예 없는 경우 (비로그인 사용자)
    if (!StringUtils.hasText(bearerToken) || !bearerToken.startsWith("Bearer ")) {
      filterChain.doFilter(request, response); // 그냥 다음 단계(컨트롤러)로 보내줌
      return;
    }

    // 2. 토큰이 있는 경우 (로그인 시도자)
    String token = bearerToken.substring(7);
    if (jwtProvider.validateToken(token)) {
      // ✅ 토큰 유효함 -> 유저 정보 세팅
      String email = jwtProvider.getEmail(token);
      UsernamePasswordAuthenticationToken auth =
          new UsernamePasswordAuthenticationToken(email, null, Collections.emptyList());
      SecurityContextHolder.getContext().setAuthentication(auth);
      filterChain.doFilter(request, response);
    } else {
      // ❌ 토큰이 만료되었거나 변조됨 -> 여기서 401을 때려야 재발급 로직이 돕니다.
      // 비로그인 사용자라면 토큰을 안 보냈을 텐데, 굳이 만료된 토큰을 보냈다는 건
      // 로그인 사용자라는 뜻이므로 401을 주는 게 맞습니다.
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      response.setContentType("application/json;charset=UTF-8");
      response.getWriter().write("{\"message\":\"토큰 만료. 재발급하세요.\"}");
      // filterChain.doFilter를 호출하지 않고 여기서 끝냄!
    }
  }


}
