package com.example.backend.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String bio;
    private String twitter;
    private String discord;
    private String github;
    private String displayName;
    private String avatarEmoji;
}
