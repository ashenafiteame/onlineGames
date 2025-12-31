package com.example.backend.service;

import com.example.backend.entity.Game;
import com.example.backend.entity.Score;
import com.example.backend.entity.User;
import com.example.backend.repository.ScoreRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScoreServiceTest {

    @Mock
    private ScoreRepository scoreRepository;

    @Mock
    private UserService userService;

    @Mock
    private GameService gameService;

    @Mock
    private AchievementService achievementService;

    @Mock
    private SocialService socialService;

    @InjectMocks
    private ScoreService scoreService;

    private User user;
    private Game game;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setTotalScore(500);
        user.setLevel(1);

        game = new Game();
        game.setName("Puzzle");
        game.setType("PUZZLE");
    }

    @Test
    void submitScore_Success() {
        // Arrange
        String gameType = "PUZZLE";
        int scoreValue = 600;

        when(gameService.getGameByType(gameType)).thenReturn(Optional.of(game));
        when(userService.saveUser(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        User updatedUser = scoreService.submitScore(user, gameType, scoreValue);

        // Assert
        assertEquals(1100, updatedUser.getTotalScore());
        assertEquals(2, updatedUser.getLevel()); // 1 + 1100/1000 = 2

        verify(scoreRepository, times(1)).save(any(Score.class));
        verify(achievementService, times(1)).checkAchievements(eq(updatedUser), eq(game), eq(scoreValue));
        verify(socialService, times(1)).logActivity(eq(updatedUser), eq("SCORE"), anyString());
    }

    @Test
    void submitScore_GameNotFound_ThrowsException() {
        // Arrange
        String gameType = "UNKNOWN";
        when(gameService.getGameByType(gameType)).thenReturn(Optional.empty());

        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            scoreService.submitScore(user, gameType, 100);
        });

        assertEquals("Game not found: UNKNOWN", exception.getMessage());
        verify(scoreRepository, never()).save(any(Score.class));
    }
}
