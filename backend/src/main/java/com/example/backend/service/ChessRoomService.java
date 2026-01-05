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
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ChessRoomService {

    @Autowired
    private GameRoomRepository gameRoomRepository;

    @Autowired
    private ObjectMapper objectMapper;

    // Constants matching frontend
    private static final int W_PAWN = 1, W_ROOK = 2, W_KNIGHT = 3, W_BISHOP = 4, W_QUEEN = 5, W_KING = 6;
    private static final int B_PAWN = 11, B_ROOK = 12, B_KNIGHT = 13, B_BISHOP = 14, B_QUEEN = 15, B_KING = 16;

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

        // Init Board (8x8)
        List<List<Integer>> board = new ArrayList<>();
        // Row 0: Black pieces
        board.add(new ArrayList<>(List.of(B_ROOK, B_KNIGHT, B_BISHOP, B_QUEEN, B_KING, B_BISHOP, B_KNIGHT, B_ROOK)));
        // Row 1: Black pawns
        board.add(new ArrayList<>(Collections.nCopies(8, B_PAWN)));
        // Rows 2-5: Empty
        for (int i = 0; i < 4; i++) {
            board.add(new ArrayList<>(Collections.nCopies(8, 0)));
        }
        // Row 6: White pawns
        board.add(new ArrayList<>(Collections.nCopies(8, W_PAWN)));
        // Row 7: White pieces
        board.add(new ArrayList<>(List.of(W_ROOK, W_KNIGHT, W_BISHOP, W_QUEEN, W_KING, W_BISHOP, W_KNIGHT, W_ROOK)));

        Map<String, Object> gameState = new HashMap<>();
        gameState.put("board", board);

        String hostName = (String) players.get(0).get("username");
        String joinerName = players.size() > 1 ? (String) players.get(1).get("username") : "AI";

        // Map users to colors
        Map<String, String> playersMap = new HashMap<>();
        playersMap.put("white", hostName);
        playersMap.put("black", joinerName);

        gameState.put("players", playersMap);
        gameState.put("turn", "white"); // White starts
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

        Map<String, Object> currentGameState = objectMapper.readValue(
                room.getGameState(), new TypeReference<Map<String, Object>>() {
                });

        // moveData = { board: [...], nextTurn: 'white'|'black', winner:
        // 'white'|'black'|'draw'|null }

        currentGameState.put("board", moveData.get("board"));
        String nextTurn = (String) moveData.get("nextTurn");
        currentGameState.put("turn", nextTurn);

        Object winnerObj = moveData.get("winner");
        if (winnerObj != null) {
            String winner = (String) winnerObj;
            currentGameState.put("winner", winner);
            room.setStatus("FINISHED");

            // Update session stats
            if (!"draw".equals(winner)) {
                @SuppressWarnings("unchecked")
                Map<String, String> playersMap = (Map<String, String>) currentGameState.get("players");
                String winnerName = playersMap.get(winner);

                Map<String, Integer> wins = objectMapper.readValue(
                        room.getSessionWins() != null ? room.getSessionWins() : "{}",
                        new TypeReference<Map<String, Integer>>() {
                        });
                wins.put(winnerName, wins.getOrDefault(winnerName, 0) + 1);
                room.setSessionWins(objectMapper.writeValueAsString(wins));
            }
            room.setGamesPlayed(room.getGamesPlayed() != null ? room.getGamesPlayed() + 1 : 1);
        }

        @SuppressWarnings("unchecked")
        Map<String, String> playersMap = (Map<String, String>) currentGameState.get("players");
        if (nextTurn != null) {
            room.setCurrentPlayerUsername(playersMap.get(nextTurn));
        }

        room.setGameState(objectMapper.writeValueAsString(currentGameState));
        room.setLastActivityAt(LocalDateTime.now());

        return gameRoomRepository.save(room);
    }
}
