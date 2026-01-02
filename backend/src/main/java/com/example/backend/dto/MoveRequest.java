package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MoveRequest {
    @NotBlank(message = "Board data is required")
    private String boardData;

    @NotBlank(message = "Next turn is required")
    private String nextTurn;
}
