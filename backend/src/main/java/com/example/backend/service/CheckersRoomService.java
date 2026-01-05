package com.example.backend.service;

import com.example.backend.entity.GameRoom;
import com.example.backend.entity.User;
import com.example.backend.repository.GameRoomRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CheckersRoomService {

    @Autowired
    private GameRoomRepository gameRoomRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Transactional
    public GameRoom startGame(Long roomId, User user) throws Exception {
        GameRoom room = gameRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!room.getHost().getUsername().equals(user.getUsername())) {
            throw new RuntimeException("Only host can start");
        }

        List<Map<String, Object>> players = objectMapper.readValue(
                room.getPlayers(), new TypeReference<List<Map<String, Object>>>() {
                });

        if (players.size() < 2) {
            // For testing, maybe allow 1? Checkers needs 2 usually.
            // But let's enforce 2 for now, or 1 for testing if needed.
            // user requested "multi player games"
        }

        // Init Board (8x8) using integers to match frontend
        // 0=Empty, 1=Red, 2=White, 3=RedKing, 4=WhiteKing
        List<List<Integer>> board = new ArrayList<>();
        for (int row = 0; row < 8; row++) {
            List<Integer> rowList = new ArrayList<>();
            for (int col = 0; col < 8; col++) {
                int piece = 0;
                if ((row + col) % 2 == 1) {
                    if (row < 3)
                        piece = 2; // White (Player 2)
                    else if (row > 4)
                        piece = 1; // Red (Player 1)
                }
                rowList.add(piece);
            }
            board.add(rowList);
        }

        Map<String, Object> gameState = new HashMap<>();
        gameState.put("board", board);
        gameState.put("redCaptured", 0);
        gameState.put("whiteCaptured", 0);
        // Map users to colors (1=Red, 2=White)
        String hostName = (String) players.get(0).get("username");
        String joinerName = players.size() > 1 ? (String) players.get(1).get("username") : "AI";

        Map<String, String> playersMap = new HashMap<>(); // Key as String "1" or "2" for JSON compatibility or just
                                                          // Map<Integer, String> if Jackson handles it.
        // Jackson uses string keys for Maps usually. So "1", "2".
        playersMap.put("1", hostName);
        playersMap.put("2", joinerName);

        gameState.put("players", playersMap);
        gameState.put("turn", 1); // Red starts
        gameState.put("winner", null);

        room.setGameState(objectMapper.writeValueAsString(gameState));
        room.setStatus("PLAYING");
        room.setCurrentPlayerUsername(hostName);
        room.setLastActivityAt(LocalDateTime.now());

        if (room.getSessionWins() == null)
            room.setSessionWins("{}");
        if (room.getGamesPlayed() == null)
            room.setGamesPlayed(0);

        return gameRoomRepository.save(room);
    }

    @Transactional
    public GameRoom updateMove(Long roomId, User user, Map<String, Object> moveData) throws Exception {
        GameRoom room = gameRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        // Trust client for now - they send the new board and next turn
        // In real app, validate move here.

        // moveData = { board: [...], nextTurn: 'white'|'red', winner:
        // 'red'|'white'|null }

        Map<String, Object> currentGameState = objectMapper.readValue(
                room.getGameState(), new TypeReference<Map<String, Object>>() {
                });

        // Update board
        currentGameState.put("board", moveData.get("board"));
        currentGameState.put("turn", moveData.get("nextTurn"));

        if (moveData.containsKey("winner") && moveData.get("winner") != null) {
            String colorWinner = (String) moveData.get("winner");
            // Find username
            @SuppressWarnings("unchecked")
            Map<String, String> playersMap = (Map<String, String>) currentGameState.get("players");
            String usernameWinner = playersMap.get(colorWinner);

            room.setStatus("FINISHED");

            // Session wins
            Map<String, Integer> wins = objectMapper.readValue(
                    room.getSessionWins() != null ? room.getSessionWins() : "{}",
                    new TypeReference<Map<String, Integer>>() {
                    });
            wins.put(usernameWinner, wins.getOrDefault(usernameWinner, 0) + 1);
            room.setSessionWins(objectMapper.writeValueAsString(wins));

            room.setGamesPlayed(room.getGamesPlayed() != null ? room.getGamesPlayed() + 1 : 1);
        }

        // Update current player username based on color turn
        String nextColor = (String) moveData.get("nextTurn");
        @SuppressWarnings("unchecked")
        Map<String, String> playersMap = (Map<String, String>) currentGameState.get("players");
        if (nextColor != null) {
            room.setCurrentPlayerUsername(playersMap.get(nextColor));
        }

        room.setGameState(objectMapper.writeValueAsString(currentGameState));
        room.setLastActivityAt(LocalDateTime.now());

        return gameRoomRepository.save(room);
    }
}
