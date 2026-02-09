package io.github.perniteo.auth.controller;

import io.github.perniteo.auth.service.AuthService;
import io.github.perniteo.auth.dto.SignUpRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
}
