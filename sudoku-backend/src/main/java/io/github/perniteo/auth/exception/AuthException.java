package io.github.perniteo.auth.exception;

import io.github.perniteo.common.exception.BaseException;
import org.springframework.http.HttpStatus;

public class AuthException extends BaseException {
  public AuthException(String message) {
    super(message, HttpStatus.UNAUTHORIZED); // 🎯 401 고정!
  }
}
