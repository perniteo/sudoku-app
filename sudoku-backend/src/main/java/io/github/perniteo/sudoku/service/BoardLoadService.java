package io.github.perniteo.sudoku.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.perniteo.sudoku.dto.SudokuBoardData;
import io.github.perniteo.sudoku.dto.SudokuBoardRow;
import io.github.perniteo.sudoku.repository.SudokuMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BoardLoadService {
  private final SudokuMapper sudokuMapper;
  private final ObjectMapper objectMapper;

  public SudokuBoardRow loadRawBoard(int difficulty) throws JsonProcessingException {
    return sudokuMapper.findRandomByDifficulty(difficulty);
  }


  public SudokuBoardData loadBoard(int difficulty) throws JsonProcessingException {
    SudokuBoardRow row = sudokuMapper.findRandomByDifficulty(difficulty);

    int[][] start = objectMapper.readValue(row.getStartJson(), int[][].class);
    int[][] answer = objectMapper.readValue(row.getAnswerJson(), int[][].class);

    return SudokuBoardData.builder()
        .difficulty(difficulty)
        .initialBoard(start)
        .solutionBoard(answer)
        .boardId(row.getBoardId())
        .build();
  }


}
