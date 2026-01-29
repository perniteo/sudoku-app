package io.github.perniteo.sudoku.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter                 // 모든 필드의 Getter 자동 생성
@Builder                // 빌더 패턴으로 객체 생성 가능하게 함
@NoArgsConstructor      // 기본 생성자 (JSON 변환 시 필수)
@AllArgsConstructor     // 모든 필드 생성자
@ToString               // 객체 출력 시 예쁘게 나오게 함
public class SudokuBoardData {
  @JsonProperty("level")
  private int difficulty;
  @JsonProperty("start_board")
  private int[][] initialBoard;
  @JsonProperty("answer_board")
  private int[][] solutionBoard;
}
