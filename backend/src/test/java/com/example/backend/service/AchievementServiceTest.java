package com.example.backend.service;

import com.example.backend.entity.Achievement;
import com.example.backend.entity.Game;
import com.example.backend.entity.User;
import com.example.backend.entity.UserAchievement;
import com.example.backend.repository.AchievementRepository;
import com.example.backend.repository.ScoreRepository;
import com.example.backend.repository.UserAchievementRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AchievementServiceTest {

    @Mock
    private AchievementRepository achievementRepository;

    @Mock
    private UserAchievementRepository userAchievementRepository;

    @Mock
    private ScoreRepository scoreRepository;

    @Mock
    private SocialService socialService;

    @InjectMocks
    private AchievementService achievementService;

    private User user;
    private Game game;
    private Achievement achievement;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setTotalScore(1001);

        game = new Game();
        game.setId(1L);

        achievement = new Achievement(1L, "Scout", "Description", "TOTAL_SCORE", 1000, "🥈");
    }

    @Test
    void checkAchievements_EarnedNew() {
        // Arrange
        when(achievementRepository.findAll()).thenReturn(List.of(achievement));
        when(userAchievementRepository.findByUser(user)).thenReturn(Collections.emptyList());

        // Act
        List<Achievement> earned = achievementService.checkAchievements(user, game, 100);

        // Assert
        assertEquals(1, earned.size());
        assertEquals("Scout", earned.get(0).getName());
        verify(userAchievementRepository, times(1)).save(any(UserAchievement.class));
        verify(socialService, times(1)).logActivity(eq(user), eq("ACHIEVEMENT"), anyString());
    }

    @Test
    void checkAchievements_AlreadyEarned() {
        // Arrange
        UserAchievement ua = new UserAchievement(1L, user, achievement, null);
        when(achievementRepository.findAll()).thenReturn(List.of(achievement));
        when(userAchievementRepository.findByUser(user)).thenReturn(List.of(ua));

        // Act
        List<Achievement> earned = achievementService.checkAchievements(user, game, 100);

        // Assert
        assertTrue(earned.isEmpty());
        verify(userAchievementRepository, never()).save(any(UserAchievement.class));
    }

    @Test
    void checkAchievements_CriteriaNotMet() {
        // Arrange
        user.setTotalScore(500);
        when(achievementRepository.findAll()).thenReturn(List.of(achievement));
        when(userAchievementRepository.findByUser(user)).thenReturn(Collections.emptyList());

        // Act
        List<Achievement> earned = achievementService.checkAchievements(user, game, 100);

        // Assert
        assertTrue(earned.isEmpty());
    }
}
