package io.github.perniteo.auth.provider;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtProvider {
  private final Key key;
  private final long accessTokenExpiration;

  // 생성자에서 yml 값을 읽어와 Key 객체 생성
  public JwtProvider(@Value("${jwt.secret}") String secretKey,
      @Value("${jwt.expiration-time}") long expirationTime) {
    this.key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    this.accessTokenExpiration = expirationTime;
  }

  // 🎯 기존 메서드 이름을 명확하게 변경
  public String createAccessToken(String email) {
    return createToken(email, accessTokenExpiration);
  }

  // 🎯 Refresh Token 발급용 메서드 추가
  public String createRefreshToken(String email) {
    // 7일 604800000L
    long refreshTokenExpiration = 604800000L;
    return createToken(email, refreshTokenExpiration);
  }

  private String createToken(String email, long validity) {
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + validity);

    return Jwts.builder()
        .setSubject(email)
        .setIssuedAt(now)
        .setExpiration(expiryDate)
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  // 토큰에서 email(Subject) 추출
  public String getEmail(String token) {
    return Jwts.parserBuilder().setSigningKey(key).build()
        .parseClaimsJws(token).getBody().getSubject();
  }

  // 토큰 유효성 검증
  public boolean validateToken(String token) {
    try {
      Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
      return true;
    } catch (Exception e) {
      return false;
    }
  }


}
