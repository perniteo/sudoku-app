package io.github.perniteo.common.config;

import io.github.perniteo.auth.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;

  // 1. 암호화 도구 등록 (AuthService에서 주입받아 사용)
  @Bean
  public BCryptPasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  // 2. 보안 필터 설정 (어떤 API를 열고 닫을지 결정)
  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
          .csrf(csrf -> csrf.disable()) // 1. 이거 안 하면 POST 요청 무조건 403 뜹니다.
          .headers(headers -> headers.frameOptions(frame -> frame.disable())) // H2 콘솔 사용 시 필요
          .authorizeHttpRequests(auth -> auth
              .requestMatchers("/api/auth/**").permitAll() // 2. 가입 경로는 무조건 허용
              .anyRequest().permitAll()                   // 3. 우선 테스트를 위해 전체 허용(나중에 수정)
        )
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }
}
