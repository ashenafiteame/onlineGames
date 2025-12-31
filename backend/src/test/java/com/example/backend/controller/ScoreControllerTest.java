package com.example.backend.controller;

import com.example.backend.entity.User;
import com.example.backend.service.ScoreService;
import com.example.backend.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ScoreControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ScoreService scoreService;

    @Mock
    private UserService userService;

    @InjectMocks
    private ScoreController scoreController;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(scoreController).build();
    }

    @Test
    void submitScore_Success() throws Exception {
        // Arrange
        Principal principal = mock(Principal.class);
        when(principal.getName()).thenReturn("testuser");
        User user = new User();
        user.setUsername("testuser");

        Map<String, Object> payload = new HashMap<>();
        payload.put("gameType", "snake");
        payload.put("score", 100);

        when(userService.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(scoreService.submitScore(any(User.class), anyString(), anyInt())).thenReturn(user);

        // Act & Assert
        mockMvc.perform(post("/api/scores")
                .principal(principal)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk());
    }
}
