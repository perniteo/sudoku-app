package io.github.perniteo;

import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication

public class SudokuApplication {

  static Map<Integer, Integer> map = new HashMap<>();

  public static void main(String[] args) {
    SpringApplication.run(SudokuApplication.class, args);
  }
}
