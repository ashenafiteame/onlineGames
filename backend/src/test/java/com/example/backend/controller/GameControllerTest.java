package com.example.backend.controller;

import com.example.backend.entity.Game;
import com.example.backend.service.GameService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class GameControllerTest {

    private MockMvc mockMvc;

    @Mock
    private GameService gameService;

    @InjectMocks
    private GameController gameController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(gameController).build();
    }

    @Test
    void getAllGames_ReturnsList() throws Exception {
        // Arrange
        when(gameService.getAllGames()).thenReturn(Collections.emptyList());

        // Act & Assert
        mockMvc.perform(get("/api/games"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    void deleteGame_Success() throws Exception {
        // Arrange
        Game game = new Game(1L, "Snake", "Classic", "snake");
        when(gameService.getGameByName("Snake")).thenReturn(Optional.of(game));

        // Act & Assert
        mockMvc.perform(delete("/api/games/Snake"))
                .andExpect(status().isOk())
                .andExpect(content().string("Game 'Snake' deleted successfully."));
    }

    @Test
    void deleteGame_NotFound() throws Exception {
        // Arrange
        when(gameService.getGameByName("NonExistent")).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(delete("/api/games/NonExistent"))
                .andExpect(status().isNotFound());
    }
}
