package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InviteRequest {
    private String gameType = "checkers";
    private String initialBoard;
}
