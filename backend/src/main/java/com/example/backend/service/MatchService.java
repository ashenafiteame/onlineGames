package com.example.backend.service;

import com.example.backend.entity.GameMatch;
import com.example.backend.entity.User;
import com.example.backend.repository.GameMatchRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class MatchService {

    @Autowired
    private GameMatchRepository matchRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public GameMatch createMatchInvite(User inviter, String opponentUsername, String gameType, String initialBoard) {
        // Check they're not challenging themselves
        if (inviter.getUsername().equals(opponentUsername)) {
            throw new RuntimeException("You cannot challenge yourself");
        }

        User opponent = userRepository.findByUsername(opponentUsername)
                .orElseThrow(() -> new RuntimeException("Opponent not found"));

        // Check for existing pending/active match between these players
        List<GameMatch> existingMatches = matchRepository.findExistingMatchBetweenPlayers(inviter, opponent);
        if (!existingMatches.isEmpty()) {
            throw new RuntimeException("You already have an active or pending match with this player");
        }

        GameMatch match = new GameMatch();
        match.setPlayer1(inviter);
        match.setPlayer2(opponent);
        match.setBoardData(initialBoard);
        match.setCurrentTurn(inviter.getUsername());
        match.setGameType(gameType);
        match.setStatus("PENDING");
        match.setCreatedAt(LocalDateTime.now());
        match.setLastMoveAt(LocalDateTime.now());

        return matchRepository.save(match);
    }

    @Transactional
    public GameMatch acceptMatch(Long matchId, User user) {
        GameMatch match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        if (!match.getPlayer2().equals(user)) {
            throw new RuntimeException("You cannot accept this match");
        }

        if (!match.getStatus().equals("PENDING")) {
            throw new RuntimeException("This match is no longer pending");
        }

        match.setStatus("ACTIVE");
        match.setLastMoveAt(LocalDateTime.now());
        return matchRepository.save(match);
    }

    @Transactional
    public GameMatch declineMatch(Long matchId, User user) {
        GameMatch match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        if (!match.getPlayer2().equals(user)) {
            throw new RuntimeException("You cannot decline this match");
        }

        if (!match.getStatus().equals("PENDING")) {
            throw new RuntimeException("This match is no longer pending");
        }

        match.setStatus("DECLINED");
        match.setLastMoveAt(LocalDateTime.now());
        return matchRepository.save(match);
    }

    @Transactional
    public GameMatch forfeitMatch(Long matchId, User user) {
        GameMatch match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        if (!match.getStatus().equals("ACTIVE")) {
            throw new RuntimeException("This match is not active");
        }

        // Verify user is a participant
        if (!match.getPlayer1().equals(user) && !match.getPlayer2().equals(user)) {
            throw new RuntimeException("You are not part of this match");
        }

        // Set winner as the OTHER player (the one who didn't forfeit)
        String winner = match.getPlayer1().equals(user)
                ? match.getPlayer2().getUsername()
                : match.getPlayer1().getUsername();

        match.setStatus("FORFEITED");
        match.setCurrentTurn(winner); // Store winner in currentTurn field
        match.setLastMoveAt(LocalDateTime.now());
        return matchRepository.save(match);
    }

    @Transactional
    public GameMatch updateMove(Long matchId, String boardData, String nextTurn, User user) {
        GameMatch match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        if (!match.getStatus().equals("ACTIVE")) {
            throw new RuntimeException("Game is not active");
        }

        if (!match.getCurrentTurn().equals(user.getUsername())) {
            throw new RuntimeException("It is not your turn");
        }

        match.setBoardData(boardData);
        match.setCurrentTurn(nextTurn);
        match.setLastMoveAt(LocalDateTime.now());

        return matchRepository.save(match);
    }

    @Transactional
    public GameMatch finishMatch(Long matchId, String status) {
        GameMatch match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));
        match.setStatus(status); // FINISHED
        return matchRepository.save(match);
    }

    public List<GameMatch> getMyMatches(User user) {
        return matchRepository.findAllActiveByUser(user);
    }

    public Optional<GameMatch> getMatch(Long id) {
        return matchRepository.findById(id);
    }
}
