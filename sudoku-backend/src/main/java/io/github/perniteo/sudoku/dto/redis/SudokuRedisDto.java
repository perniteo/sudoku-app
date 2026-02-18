package io.github.perniteo.sudoku.dto.redis;


import io.github.perniteo.sudoku.domain.GameStatus;
import io.github.perniteo.sudoku.domain.SudokuGame;
import io.github.perniteo.sudoku.domain.dto.CellRedisDto;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PUBLIC) // Jackson이 빈 객체 만들 때 씀
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@Builder
public class SudokuRedisDto {

  private LocalDateTime startedAt;
  private GameStatus status;
  private CellRedisDto[][] puzzleBoard;  // SudokuBoard 객체 대신 순수 배열로 저장
  private int[][] answerBoard;
  private int life;
  private int difficulty;
  private long elapsedTime; // 실제 플레이한 초(seconds)를 저장할 필드
  private long boardId; // 추가

//  // 도메인(SudokuGame) -> Redis DTO 변환
//  public static SudokuRedisDto from(SudokuGame game) {
//    return SudokuRedisDto.builder()
//        .startedAt(game.getStartedAt())
//        .status(game.getStatus())
//        // SudokuBoard에서 DTO 배열을 추출하는 메서드 호출
//        .puzzleBoard(game.getPuzzleBoard().getCellSnapshots())
//        .answerBoard(game.getAnswerBoard().getMatrix())
//        .life(game.getLife())
//        .difficulty(game.getDifficulty())
//        .build();
//  }
}
