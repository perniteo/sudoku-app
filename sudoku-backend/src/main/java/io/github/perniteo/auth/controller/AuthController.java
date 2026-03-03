package io.github.perniteo.auth.controller;

import io.github.perniteo.auth.dto.ReissueRequest;
import io.github.perniteo.auth.dto.SignInRequest;
import io.github.perniteo.auth.dto.TokenResponse;
import io.github.perniteo.auth.service.AuthService;
import io.github.perniteo.auth.dto.SignUpRequest;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;


  // POST /api/auth/signup
  @PostMapping("/signup")
  public ResponseEntity<String> signUp(@RequestBody SignUpRequest dto) {
    authService.signUp(dto);
    return ResponseEntity.status(HttpStatus.CREATED).body("회원가입이 완료되었습니다.");
  }

  @PostMapping("/sign-in")
  public ResponseEntity<TokenResponse> signIn(@RequestBody SignInRequest dto) {
    TokenResponse tokens = authService.signIn(dto);
    System.out.println("로그인 시도 이메일: " + dto.getEmail());
    System.out.println("로그인 시도 비번: " + dto.getPassword());
    return ResponseEntity.ok(tokens); // 바디에 토큰 담아서 보냄
  }

  @PostMapping("/reissue")
  public ResponseEntity<TokenResponse> reissue(@RequestBody ReissueRequest dto) {
    // 🎯 프론트가 준 Refresh Token을 검증하고 새 Access Token 발급
    TokenResponse tokens = authService.reissue(dto.getRefreshToken());
    return ResponseEntity.ok(tokens);
  }

  @PostMapping("/sign-out")
  public ResponseEntity<String> signOut(Principal principal) {
    // Principal에서 현재 로그인한 유저 이메일을 꺼내서 로그아웃 처리
    authService.signOut(principal.getName());
    return ResponseEntity.ok("로그아웃되었습니다.");
  }

  @GetMapping("/hello")
  public void hello() {

  }
}
