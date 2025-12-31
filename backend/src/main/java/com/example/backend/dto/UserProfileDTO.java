package com.example.backend.dto;

import com.example.backend.entity.Achievement;
import com.example.backend.entity.Activity;
import com.example.backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {
    private User user;
    private List<Achievement> achievements;
    private List<Activity> recentActivities;
}
