package io.github.perniteo.auth.service;

import io.github.perniteo.auth.dto.SignUpRequest;
import io.github.perniteo.auth.entity.User;
import io.github.perniteo.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final BCryptPasswordEncoder passwordEncoder; // 암호화 도구 주입

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
}