package io.github.perniteo.sudoku.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ErrorResponse {
  private String code;    // 에러 코드 (예: "ROOM_FULL", "INVALID_MOVE")
  private String message; // 사용자에게 보여줄 메시지
}