package io.github.perniteo.auth.service;

import io.github.perniteo.auth.dto.SignInRequest;
import io.github.perniteo.auth.dto.SignUpRequest;
import io.github.perniteo.auth.dto.TokenResponse;
import io.github.perniteo.auth.entity.User;
import io.github.perniteo.auth.provider.JwtProvider;
import io.github.perniteo.auth.repository.UserRepository;
import io.github.perniteo.auth.exception.AuthException;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final BCryptPasswordEncoder passwordEncoder; // 암호화 도구 주입
  private final JwtProvider jwtProvider;
  private final StringRedisTemplate stringRedisTemplate;// 🎯 Redis 주입

  @Transactional // 하나라도 실패하면 롤백! (원자성)
  public void signUp(SignUpRequest dto) {
    // 1. 중복 검증 (플랫폼의 기본)
    if (userRepository.existsByEmail(dto.getEmail())) {
      throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
    }
    if (userRepository.existsByNickname(dto.getNickname())) {
      throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
    }

    // 2. 비밀번호 암호화 및 유저 생성
    User user = User.builder()
        .email(dto.getEmail())
        .password(passwordEncoder.encode(dto.getPassword())) // 여기서 암호화!
        .nickname(dto.getNickname())
        .build();

    // 3. DB 저장 (JPA가 INSERT 쿼리 자동 생성)
    userRepository.save(user);

    // (추후 여기에 UserStats 초기화 로직 추가 예정)
  }

  @Transactional(readOnly = true)
  public TokenResponse signIn(SignInRequest dto) { // 🎯 반환 타입 변경
    // 1. 유저 검증
    User user = userRepository.findByEmail(dto.getEmail())
        .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

    if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
      throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
    }

    // 2. 토큰 2종 세트 발급
    String accessToken = jwtProvider.createAccessToken(user.getEmail());
    String refreshToken = jwtProvider.createRefreshToken(user.getEmail());

    // 3. 🎯 Refresh Token만 Redis에 저장 (Key: "RT:이메일", TTL: 7일)
    stringRedisTemplate.opsForValue().set(
        "RT:" + user.getEmail(),
        refreshToken,
        7,
        TimeUnit.DAYS
    );

    return new TokenResponse(accessToken, refreshToken);
  }

  public void signOut(String email) {
    stringRedisTemplate.delete("RT:" + email);
  }

  @Transactional
  public TokenResponse reissue(String refreshToken) {
    // 1. JWT 자체가 유효한지(서명, 만료일) 체크
    if (!jwtProvider.validateToken(refreshToken)) {
      throw new AuthException("유효하지 않은 리프레시 토큰입니다.");
    }

    // 2. 토큰에서 이메일 추출
    String email = jwtProvider.getEmail(refreshToken);

    // 3. Redis에 저장된 토큰과 일치하는지 확인
    String savedToken = stringRedisTemplate.opsForValue().get("RT:" + email);
    if (savedToken == null || !savedToken.equals(refreshToken)) {
      throw new AuthException("로그인 정보가 일치하지 않거나 만료되었습니다.");
    }

    // 4. 새 토큰 2종 발급 (Rotation 전략 - 둘 다 새로 발급)
    TokenResponse newTokens = new TokenResponse(
        jwtProvider.createAccessToken(email),
        jwtProvider.createRefreshToken(email)
    );

    // 5. Redis 갱신 (새로운 리프레시 토큰으로 교체)
    stringRedisTemplate.opsForValue().set("RT:" + email, newTokens.getRefreshToken(), 7, TimeUnit.DAYS);

    return newTokens;
  }

}