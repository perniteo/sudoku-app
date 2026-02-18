package io.github.perniteo.sudoku.controller.dto;

import io.github.perniteo.sudoku.domain.GameRecord;
import java.util.List;
import java.util.Map;

public record RecordResponse(
    List<GameRecord> records,
    Map<String, Object> summary
) {}