package io.github.perniteo.sudoku.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.perniteo.sudoku.dto.SudokuBoardData;
import io.github.perniteo.sudoku.repository.SudokuMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BoardGenerateService {
  // 인터페이스만 선언해도 스프링이 알아서 구현체를 꽂아줌!
  private final SudokuMapper sudokuMapper;
  private final ObjectMapper objectMapper;

  public void insertData(SudokuBoardData data) throws JsonProcessingException {
    // 1. Jackson으로 변환
    String startJson = objectMapper.writeValueAsString(data.getInitialBoard());
    String answerJson = objectMapper.writeValueAsString(data.getSolutionBoard());

    // 2. 인터페이스 메서드 호출 (실제로는 MyBatis 가 만든 구현체가 실행됨)
    sudokuMapper.insertSudoku(data.getDifficulty(), startJson, answerJson);
  }
}
