package io.github.perniteo.sudoku.dto.redis;


import io.github.perniteo.sudoku.domain.GameStatus;
import io.github.perniteo.sudoku.domain.SudokuGame;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // Jackson이 빈 객체 만들 때 씀
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class SudokuRedisDto {

  private LocalDateTime startedAt;
  private GameStatus status;
  private int[][] puzzleBoard;  // SudokuBoard 객체 대신 순수 배열로 저장
  private int[][] answerBoard;
  private int life;
  private int difficulty;

//  // 도메인 -> DTO (저장할 때 사용)
//  public static SudokuRedisDto from(SudokuGame game) {
//    return SudokuRedisDto.builder()
//        .startedAt(game.getStartedAt())
//        .status(game.getStatus())
//        .puzzleBoard(game.getPuzzleBoard().getMatrix()) // Matrix 꺼내는 메서드 필요!
//        .answerBoard(game.getAnswerBoard().getMatrix())
//        .life(game.getLife())
//        .difficulty(game.getDifficulty())
//        .build();
//  }
}
