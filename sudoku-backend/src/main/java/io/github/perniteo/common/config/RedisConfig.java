package io.github.perniteo.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettucePoolingClientConfiguration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

  @Value("${REDIS_HOST:localhost}")
  private String host;

  @Value("${REDIS_PORT:6379}")
  private int port;

  @Value("${REDIS_PASSWORD:}")
  private String password;

  @Bean
  public RedisConnectionFactory redisConnectionFactory() {
    // 🎯 1. 커넥션 풀 설정 (미리 연결해두기)
    GenericObjectPoolConfig<Object> poolConfig = new GenericObjectPoolConfig<>();
    poolConfig.setMaxTotal(10);
    poolConfig.setMaxIdle(10);
    poolConfig.setMinIdle(5); // 최소 5개는 항상 연결 유지 (0.1초 컷의 핵심)

    // 🎯 2. [수정] SSL 설정 동적 제어
    var clientConfigBuilder = LettucePoolingClientConfiguration.builder()
        .poolConfig(poolConfig);

    // 💡 호스트가 localhost가 아닐 때만 SSL을 활성화함 (Upstash 등 배포용)
    if (!host.equals("localhost")) {
      clientConfigBuilder.useSsl();
    }

    LettucePoolingClientConfiguration clientConfig = clientConfigBuilder.build();

    // 🎯 3. 서버 정보 설정 (환경 변수에서 가져옴)
    RedisStandaloneConfiguration serverConfig = new RedisStandaloneConfiguration(host, port);
    serverConfig.setPassword(RedisPassword.of(password));

    return new LettuceConnectionFactory(serverConfig, clientConfig);
  }

  @Bean
  public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
    RedisTemplate<String, Object> template = new RedisTemplate<>();
    template.setConnectionFactory(connectionFactory);

    // 1. Key Serializer: String으로 저장해야 redis-cli에서 보기 편함
    template.setKeySerializer(new StringRedisSerializer());

    // 2. Value Serializer: 객체를 JSON으로 직렬화
    // ObjectMapper에 타입 정보를 포함시켜서 역직렬화 시 캐스팅 에러 방지
    ObjectMapper objectMapper = new ObjectMapper();
    objectMapper.registerModule(new JavaTimeModule()); // 날짜 데이터 대비
    objectMapper.activateDefaultTyping(
        BasicPolymorphicTypeValidator.builder()
            .allowIfBaseType(Object.class)
            .build(),
        ObjectMapper.DefaultTyping.NON_FINAL
    );

    GenericJackson2JsonRedisSerializer serializer = new GenericJackson2JsonRedisSerializer(objectMapper);
    template.setValueSerializer(serializer);

    // Hash 구조를 쓸 때를 대비한 설정
    template.setHashKeySerializer(new StringRedisSerializer());
    template.setHashValueSerializer(serializer);

    return template;
  }
}
