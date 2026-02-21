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
    http  // 1. CORS 설정 연결
          .cors(cors -> cors.configurationSource(corsConfigurationSource()))
          .csrf(csrf -> csrf.disable()) // 1. 이거 안 하면 POST 요청 무조건 403 뜹니다.
          .headers(headers -> headers.frameOptions(frame -> frame.disable())) // H2 콘솔 사용 시 필요
          .authorizeHttpRequests(auth -> auth
              .requestMatchers("/api/auth/**").permitAll() // 2. 가입 경로는 무조건 허용
              .anyRequest().authenticated()               // 3. 우선 테스트를 위해 전체 허용(나중에 수정)
        )
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }

  // 2. CORS 세부 설정 빈 추가
  @Bean
  public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
    org.springframework.web.cors.CorsConfiguration configuration = new org.springframework.web.cors.CorsConfiguration();


    // 🎯 로컬 테스트용 + Vercel 배포용 주소 추가
    configuration.setAllowedOrigins(java.util.List.of(
        "http://localhost:3000",
        "https://sudoku-app-production-fc40.up.railway.app", // 내 API 주소
        "https://sudoku-app-liard-eta.vercel.app",         // 현재 에러난 주소
        "https://sudoku-app-git-main-perniteos-projects.vercel.app", // 브랜치 주소
        "https://sudoku-app.vercel.app"                    // 🎯 (예상되는) 공식 대표 주소
    ));
    configuration.addAllowedHeader("*"); // 모든 헤더 허용
    configuration.addAllowedMethod("*"); // 모든 HTTP 메서드 허용
    configuration.setAllowCredentials(true); // 인증정보(쿠키 등) 허용

    // 🔥 [이걸 추가!] 3600초(1시간) 동안 OPTIONS 요청 결과를 브라우저에 캐싱함
    configuration.setMaxAge(3600L);

    org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }


}
