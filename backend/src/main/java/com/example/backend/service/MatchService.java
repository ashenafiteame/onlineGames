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
    public GameMatch acceptMatch(@org.springframework.lang.NonNull Long matchId, User user) {
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
    public GameMatch declineMatch(@org.springframework.lang.NonNull Long matchId, User user) {
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
    public GameMatch forfeitMatch(@org.springframework.lang.NonNull Long matchId, User user) {
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
    public GameMatch updateMove(@org.springframework.lang.NonNull Long matchId, String boardData, String nextTurn,
            User user) {
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
    public GameMatch finishMatch(@org.springframework.lang.NonNull Long matchId, String status) {
        GameMatch match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));
        match.setStatus(status); // FINISHED
        return matchRepository.save(match);
    }

    public List<GameMatch> getMyMatches(User user) {
        return matchRepository.findAllActiveByUser(user);
    }

    public Optional<GameMatch> getMatch(@org.springframework.lang.NonNull Long id) {
        return matchRepository.findById(id);
    }

    @Transactional
    public GameMatch requestReplay(@org.springframework.lang.NonNull Long matchId, User user) {
        GameMatch match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        // Only allow replay if match is finished or forfeited
        if (!"FINISHED".equals(match.getStatus()) && !"FORFEITED".equals(match.getStatus())) {
            throw new RuntimeException("Match is not over");
        }

        // Determine which player is requesting
        boolean isPlayer1 = match.getPlayer1().equals(user);
        boolean isPlayer2 = match.getPlayer2().equals(user);

        if (!isPlayer1 && !isPlayer2) {
            throw new RuntimeException("You are not part of this match");
        }

        // Set replay flag
        if (isPlayer1) {
            match.setPlayer1Replay(true);
        } else {
            match.setPlayer2Replay(true);
        }

        // Check if both players want to replay
        // Use Boolean.TRUE.equals to handle potential nulls safely, though default is
        // false
        if (Boolean.TRUE.equals(match.getPlayer1Replay()) && Boolean.TRUE.equals(match.getPlayer2Replay())) {
            // Reset match
            match.setStatus("ACTIVE");
            match.setPlayer1Replay(false);
            match.setPlayer2Replay(false);
            match.setLastMoveAt(LocalDateTime.now());

            // Reset board based on game type
            if ("connectfour".equals(match.getGameType())) {
                // 6 rows x 7 cols empty board
                match.setBoardData("[[null,null,null,null,null,null,null]," +
                        "[null,null,null,null,null,null,null]," +
                        "[null,null,null,null,null,null,null]," +
                        "[null,null,null,null,null,null,null]," +
                        "[null,null,null,null,null,null,null]," +
                        "[null,null,null,null,null,null,null]]");
            } else if ("checkers".equals(match.getGameType())) {
                // Standard checkers board
                // For simplicity, we might need a proper initial state string or helper
                // reuse createMatchInvite logic? NO, createMatchInvite takes initialBoard as
                // arg.
                // We should probably rely on frontend to send initial board? No, this is server
                // logic.
                // For now, focusing on Connect Four as per request.
                // TODO: Support Checkers reset if needed.
            }

            // Swap turns
            String p1 = match.getPlayer1().getUsername();
            String p2 = match.getPlayer2().getUsername();
            // Simple swap: if it was p1's turn (or they won), make it p2's
            // Actually, Connect Four implementation sets currentTurn to winner or p1 if p1
            // starts.
            // Let's just alternate who starts match.
            // But we don't track who started last time easily without history.
            // Let's just set turn to Player 1 for now (Red always starts in our Connect
            // Four impl?)
            // Looking at ConnectFour.jsx:
            // const [currentPlayer, setCurrentPlayer] = useState(RED);
            // Red starts.
            // In backend: if (data.currentTurn === data.player1.username)
            // setCurrentPlayer(RED);
            // So turn determines color.
            // Let's set turn to player 2 (Yellow) to let them start?
            // Actually standard C4: Red plays first. If we want P2 to be Red, we swap
            // P1/P2?
            // "at the same room" => keep P1/P2 same.
            // Let's just set turn to P1 (Red) to keep it simple, or P2 if we want alternate
            // starts.
            // I'll set it to P1 for consistency with "New Game".
            match.setCurrentTurn(p1);
        }

        return matchRepository.save(match);
    }
}
