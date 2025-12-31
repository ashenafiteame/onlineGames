package com.example.backend.service;

import com.example.backend.entity.Game;
import com.example.backend.repository.GameRepository;
import com.example.backend.repository.ScoreRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GameServiceTest {

    @Mock
    private GameRepository gameRepository;

    @Mock
    private ScoreRepository scoreRepository;

    @InjectMocks
    private GameService gameService;

    private Game game;

    @BeforeEach
    void setUp() {
        game = new Game(1L, "Test Game", "Description", "TEST");
    }

    @Test
    void getGameByType_Success() {
        // Arrange
        when(gameRepository.findByType("TEST")).thenReturn(Optional.of(game));

        // Act
        Optional<Game> result = gameService.getGameByType("TEST");

        // Assert
        assertTrue(result.isPresent());
        assertEquals("Test Game", result.get().getName());
    }

    @Test
    void deleteGame_Success() {
        // Act
        gameService.deleteGame(game);

        // Assert
        verify(scoreRepository, times(1)).deleteByGame(game);
        verify(gameRepository, times(1)).delete(game);
    }
}
