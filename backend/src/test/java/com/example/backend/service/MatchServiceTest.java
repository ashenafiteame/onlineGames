package com.example.backend.service;

import com.example.backend.entity.GameMatch;
import com.example.backend.entity.User;
import com.example.backend.repository.GameMatchRepository;
import com.example.backend.repository.UserRepository;
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
class MatchServiceTest {

    @Mock
    private GameMatchRepository matchRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SocialService socialService;

    @InjectMocks
    private MatchService matchService;

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
        match.setCurrentTurn("player1");
        match.setGameType("checkers");
    }

    @Test
    void createMatchInvite_Success() {
        when(userRepository.findByUsername("player2")).thenReturn(Optional.of(player2));
        when(socialService.areFriends(player1, player2)).thenReturn(true);
        when(matchRepository.save(any(GameMatch.class))).thenReturn(match);

        GameMatch result = matchService.createMatchInvite(player1, "player2", "checkers", "{}");

        assertNotNull(result);
        assertEquals("player1", result.getPlayer1().getUsername());
        assertEquals("player2", result.getPlayer2().getUsername());
        verify(matchRepository).save(any(GameMatch.class));
    }

    @Test
    void createMatchInvite_NotFriends_ThrowsException() {
        when(userRepository.findByUsername("player2")).thenReturn(Optional.of(player2));
        when(socialService.areFriends(player1, player2)).thenReturn(false);

        Exception exception = assertThrows(RuntimeException.class, () -> {
            matchService.createMatchInvite(player1, "player2", "checkers", "{}");
        });

        assertEquals("You can only challenge friends", exception.getMessage());
    }

    @Test
    void acceptMatch_Success() {
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
        when(matchRepository.save(any(GameMatch.class))).thenAnswer(i -> {
            GameMatch m = i.getArgument(0);
            return m;
        });

        GameMatch result = matchService.acceptMatch(1L, player2);

        assertEquals("ACTIVE", result.getStatus());
    }

    @Test
    void acceptMatch_WrongPlayer_ThrowsException() {
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

        Exception exception = assertThrows(RuntimeException.class, () -> {
            matchService.acceptMatch(1L, player1);
        });

        assertEquals("You cannot accept this match", exception.getMessage());
    }

    @Test
    void updateMove_Success() {
        match.setStatus("ACTIVE");
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
        when(matchRepository.save(any(GameMatch.class))).thenAnswer(i -> i.getArgument(0));

        GameMatch result = matchService.updateMove(1L, "{newBoard}", "player2", player1);

        assertEquals("{newBoard}", result.getBoardData());
        assertEquals("player2", result.getCurrentTurn());
    }

    @Test
    void updateMove_NotActive_ThrowsException() {
        match.setStatus("PENDING");
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

        Exception exception = assertThrows(RuntimeException.class, () -> {
            matchService.updateMove(1L, "{newBoard}", "player2", player1);
        });

        assertEquals("Game is not active", exception.getMessage());
    }

    @Test
    void updateMove_WrongTurn_ThrowsException() {
        match.setStatus("ACTIVE");
        match.setCurrentTurn("player2"); // It's player2's turn
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

        Exception exception = assertThrows(RuntimeException.class, () -> {
            matchService.updateMove(1L, "{newBoard}", "player1", player1); // player1 tries to move
        });

        assertEquals("It is not your turn", exception.getMessage());
    }
}
