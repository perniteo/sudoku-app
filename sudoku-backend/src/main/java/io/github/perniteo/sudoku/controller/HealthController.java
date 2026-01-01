package io.github.perniteo.sudoku.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

  @GetMapping("/health")
  public String health() {
    return "ok?";
  }

  @GetMapping("/health2")
  public Map<String, String> health2() {
    return Map.of("status", "maybe ok");
  }

}
