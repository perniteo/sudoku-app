package io.github.perniteo.sudoku.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {
  private String sender; // 보낸 사람 닉네임
  private String content; // 메시지 내용
  private String timestamp; // 보낸 시간 (선택)
}
