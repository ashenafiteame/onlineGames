package com.example.backend.controller;

import com.example.backend.entity.GameMatch;
import com.example.backend.entity.User;
import com.example.backend.service.MatchService;
import com.example.backend.service.UserService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class MatchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MatchService matchService;

    @MockBean
    private UserService userService;

    private User player1;
    private User player2;
    private GameMatch match;

    @BeforeEach
    void setUp() {
        player1 = new User();
        player1.setId(1L);
        player1.setUsername("player1");

        player2 = new User();
        player2.setId(2L);
        player2.setUsername("player2");

        match = new GameMatch();
        match.setId(1L);
        match.setPlayer1(player1);
        match.setPlayer2(player2);
        match.setStatus("PENDING");
        match.setGameType("checkers");
        match.setCreatedAt(LocalDateTime.now());
        match.setLastMoveAt(LocalDateTime.now());
    }

    @Test
    @WithMockUser(username = "player1")
    void invite_Success() throws Exception {
        when(userService.findByUsername("player1")).thenReturn(Optional.of(player1));
        when(matchService.createMatchInvite(any(User.class), eq("player2"), eq("checkers"), anyString()))
                .thenReturn(match);

        String jsonBody = "{\"gameType\": \"checkers\", \"initialBoard\": \"{}\"}";

        mockMvc.perform(post("/api/matches/invite/player2")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.player1.username").value("player1"))
                .andExpect(jsonPath("$.player2.username").value("player2"));
    }

    @Test
    @WithMockUser(username = "player2")
    void accept_Success() throws Exception {
        match.setStatus("ACTIVE");
        when(userService.findByUsername("player2")).thenReturn(Optional.of(player2));
        when(matchService.acceptMatch(eq(1L), any(User.class))).thenReturn(match);

        mockMvc.perform(post("/api/matches/1/accept")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @WithMockUser(username = "player1")
    void move_Success() throws Exception {
        match.setStatus("ACTIVE");
        match.setCurrentTurn("player2");
        match.setBoardData("{moved}");

        when(userService.findByUsername("player1")).thenReturn(Optional.of(player1));
        when(matchService.updateMove(eq(1L), anyString(), eq("player2"), any(User.class)))
                .thenReturn(match);

        String jsonBody = "{\"boardData\": \"{moved}\", \"nextTurn\": \"player2\"}";

        mockMvc.perform(post("/api/matches/1/move")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentTurn").value("player2"))
                .andExpect(jsonPath("$.boardData").value("{moved}"));
    }
}
