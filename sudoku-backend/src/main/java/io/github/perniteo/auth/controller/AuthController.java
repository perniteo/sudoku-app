package io.github.perniteo.auth.controller;

import io.github.perniteo.auth.dto.ReissueRequest;
import io.github.perniteo.auth.dto.SignInRequest;
import io.github.perniteo.auth.dto.TokenResponse;
import io.github.perniteo.auth.exception.AuthException;
import io.github.perniteo.auth.service.AuthService;
import io.github.perniteo.auth.dto.SignUpRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
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
  public ResponseEntity<TokenResponse> signIn(@RequestBody SignInRequest dto, HttpServletResponse response) {
    TokenResponse tokens = authService.signIn(dto);
    System.out.println("로그인 시도 이메일: " + dto.getEmail());
    System.out.println("로그인 시도 비번: " + dto.getPassword());

    ResponseCookie cookie = ResponseCookie.from("refreshToken", tokens.getRefreshToken())
        .httpOnly(true)
        .secure(true)
        .path("/")
        .maxAge(7 * 24 * 60 * 60) // 7days
        .sameSite("None")
        .build();

    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

    return ResponseEntity.ok(
        new TokenResponse(tokens.getAccessToken(), "", tokens.getEmail(), tokens.getNickname())); // 바디에는 accessToken
  }

  @PostMapping("/reissue")
  public ResponseEntity<TokenResponse> reissue(
      @CookieValue(name = "refreshToken", required = false) String refreshToken,
      HttpServletResponse response) {

    if (refreshToken == null) throw new AuthException("리프레시 토큰이 없습니다");
    // 🎯 프론트가 준 Refresh Token을 검증하고 새 Access Token 발급
    TokenResponse tokens = authService.reissue(refreshToken);

    ResponseCookie cookie = ResponseCookie.from("refreshToken", tokens.getRefreshToken())
        .httpOnly(true).secure(true).path("/").maxAge(7 * 24 * 60 * 60).sameSite("None").build();

    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

    return ResponseEntity.ok(new TokenResponse(tokens.getAccessToken(), null, tokens.getEmail(), tokens.getNickname()));
  }

  @PostMapping("/sign-out")
  public ResponseEntity<String> signOut(Principal principal, HttpServletResponse response) {
    // Principal에서 현재 로그인한 유저 이메일을 꺼내서 로그아웃 처리
    authService.signOut(principal.getName());

    ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
        .httpOnly(true).secure(true).path("/").maxAge(0).sameSite("None").build();

    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

    return ResponseEntity.ok("로그아웃되었습니다.");
  }

  @GetMapping("/hello")
  public void hello() {

  }
}
