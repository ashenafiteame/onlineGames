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

        // Check variant
        boolean isInternational = false;
        if (room.getSettings() != null) {
            Map<String, Object> settings = objectMapper.readValue(
                    room.getSettings() != null ? room.getSettings() : "{}",
                    new TypeReference<Map<String, Object>>() {
                    });
            isInternational = "international".equals(settings.get("variant"));
        }

        int rows = isInternational ? 10 : 8;
        int cols = isInternational ? 10 : 8;

        // Init Board
        // 0=Empty, 1=Red, 2=White, 3=RedKing, 4=WhiteKing
        List<List<Integer>> board = new ArrayList<>();
        for (int row = 0; row < rows; row++) {
            List<Integer> rowList = new ArrayList<>();
            for (int col = 0; col < cols; col++) {
                int piece = 0;
                // Pieces are on dark squares (sum is odd if 0,0 is light)
                if ((row + col) % 2 == 1) {
                    if (row < (rows / 2) - 1)
                        piece = 2; // White (Player 2 - Joiner)
                    else if (row >= (rows / 2) + 1)
                        piece = 1; // Red (Player 1 - Host)
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

        // moveData = { board: [...], nextTurn: 1|2, winner: 1|2|null }

        Map<String, Object> currentGameState = objectMapper.readValue(
                room.getGameState(), new TypeReference<Map<String, Object>>() {
                });

        // Update board
        currentGameState.put("board", moveData.get("board"));
        Object nextTurnObj = moveData.get("nextTurn");
        currentGameState.put("turn", nextTurnObj);

        if (moveData.containsKey("winner") && moveData.get("winner") != null) {
            Object winnerObj = moveData.get("winner");
            String colorWinner = String.valueOf(winnerObj);

            // Find username
            @SuppressWarnings("unchecked")
            Map<String, String> playersMap = (Map<String, String>) currentGameState.get("players");
            String usernameWinner = playersMap.get(colorWinner);

            room.setStatus("FINISHED");
            currentGameState.put("winner", colorWinner); // Store winner in game state too

            // Session wins
            Map<String, Integer> wins = objectMapper.readValue(
                    room.getSessionWins() != null ? room.getSessionWins() : "{}",
                    new TypeReference<Map<String, Integer>>() {
                    });
            if (usernameWinner != null) {
                wins.put(usernameWinner, wins.getOrDefault(usernameWinner, 0) + 1);
            }
            room.setSessionWins(objectMapper.writeValueAsString(wins));

            room.setGamesPlayed(room.getGamesPlayed() != null ? room.getGamesPlayed() + 1 : 1);
        }

        // Update current player username based on color turn
        if (nextTurnObj != null) {
            String nextColor = String.valueOf(nextTurnObj);
            @SuppressWarnings("unchecked")
            Map<String, String> playersMap = (Map<String, String>) currentGameState.get("players");
            room.setCurrentPlayerUsername(playersMap.get(nextColor));
        }

        room.setGameState(objectMapper.writeValueAsString(currentGameState));
        room.setLastActivityAt(LocalDateTime.now());

        return gameRoomRepository.save(room);
    }

    public GameRoom requestReplay(Long roomId, User user) throws Exception {
        GameRoom room = gameRoomRepository.findById(roomId)
                .orElseThrow(() -> new Exception("Room not found"));

        if (!room.getStatus().equals("FINISHED")) {
            throw new Exception("Game is not finished");
        }

        // Check variant
        boolean isInternational = false;
        if (room.getSettings() != null) {
            Map<String, Object> settings = objectMapper.readValue(
                    room.getSettings() != null ? room.getSettings() : "{}",
                    new TypeReference<Map<String, Object>>() {
                    });
            isInternational = "international".equals(settings.get("variant"));
        }

        int rows = isInternational ? 10 : 8;
        int cols = isInternational ? 10 : 8;

        // Re-init Board
        List<List<Integer>> board = new ArrayList<>();
        for (int row = 0; row < rows; row++) {
            List<Integer> rowList = new ArrayList<>();
            for (int col = 0; col < cols; col++) {
                int piece = 0;
                if ((row + col) % 2 == 1) {
                    if (row < (rows / 2) - 1)
                        piece = 2; // White
                    else if (row >= (rows / 2) + 1)
                        piece = 1; // Red
                }
                rowList.add(piece);
            }
            board.add(rowList);
        }

        Map<String, Object> currentGameState = objectMapper.readValue(room.getGameState(),
                new TypeReference<Map<String, Object>>() {
                });

        currentGameState.put("board", board);
        currentGameState.put("turn", 1);
        currentGameState.put("winner", null);
        currentGameState.put("redCaptured", 0);
        currentGameState.put("whiteCaptured", 0);

        @SuppressWarnings("unchecked")
        Map<String, String> playersMap = (Map<String, String>) currentGameState.get("players");

        room.setGameState(objectMapper.writeValueAsString(currentGameState));
        room.setStatus("PLAYING");
        room.setCurrentPlayerUsername(playersMap.get("1")); // Red starts
        room.setLastActivityAt(LocalDateTime.now());

        return gameRoomRepository.save(room);
    }
}
