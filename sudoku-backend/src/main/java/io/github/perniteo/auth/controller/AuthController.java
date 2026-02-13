package io.github.perniteo.auth.controller;

import io.github.perniteo.auth.dto.SignInRequest;
import io.github.perniteo.auth.service.AuthService;
import io.github.perniteo.auth.dto.SignUpRequest;
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
  public ResponseEntity<String> signIn(@RequestBody SignInRequest dto) {
    String token = authService.signIn(dto);
    System.out.println("로그인 시도 이메일: " + dto.getEmail());
    System.out.println("로그인 시도 비번: " + dto.getPassword());
    return ResponseEntity.ok(token); // 바디에 토큰 담아서 보냄
  }

  @GetMapping("/hello")
  public void hello() {

  }
}
