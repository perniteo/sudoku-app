package io.github.perniteo.sudoku.repository;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface SudokuMapper {
  void insertSudoku(
      @Param("difficulty") int difficulty,
      @Param("startBoard") String startBoard, // Jackson이 변환한 String
      @Param("answerBoard") String answerBoard); // Jackson이 변환한 String
}
