package io.github.perniteo.auth.repository;

import io.github.perniteo.auth.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

// JpaRepository<엔티티, PK타입>을 상속받으면 save, findById 등을 공짜로 씁니다.
public interface UserRepository extends JpaRepository<User, Long> {

  // 1. 가입 시 이메일 중복 확인 (이미 존재하면 true 반환)
  boolean existsByEmail(String email);

  // 2. 가입 시 닉네임 중복 확인 (플랫폼 확장성 고려)
  boolean existsByNickname(String nickname);

  // 3. 로그인 시 이메일로 유저 찾기
  Optional<User> findByEmail(String email);
}
