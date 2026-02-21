package io.github.perniteo.common.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(BaseException.class)
  public ResponseEntity<String> handleBaseException(BaseException e) {
    return ResponseEntity.status(e.getStatus()).body(e.getMessage());
  }
}
