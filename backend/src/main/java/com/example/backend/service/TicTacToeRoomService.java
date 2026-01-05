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
import java.util.Collections;

@Service
public class TicTacToeRoomService {

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

        // Init Board (Array of 9 nulls)
        List<String> board = new ArrayList<>(Collections.nCopies(9, null));

        Map<String, Object> gameState = new HashMap<>();
        gameState.put("board", board);

        String hostName = (String) players.get(0).get("username");
        String joinerName = players.size() > 1 ? (String) players.get(1).get("username") : "AI";

        // Map users to symbols
        Map<String, String> playersMap = new HashMap<>();
        playersMap.put("X", hostName);
        playersMap.put("O", joinerName);

        gameState.put("players", playersMap);
        gameState.put("turn", "X"); // X starts
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

        // moveData = { board: [...], nextTurn: 'X'|'O', winner: 'X'|'O'|'draw'|null }

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
