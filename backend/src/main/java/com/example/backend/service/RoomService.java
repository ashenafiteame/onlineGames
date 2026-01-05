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
import java.util.*;

@Service
public class RoomService {

    @Autowired
    private GameRoomRepository roomRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private ConnectFourRoomService connectFourRoomService;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private TicTacToeRoomService ticTacToeRoomService;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private CheckersRoomService checkersRoomService;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private ChessRoomService chessRoomService;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private UnoRoomService unoRoomService;

    // Create a new room (default settings)
    @Transactional
    public GameRoom createRoom(User host, String gameType, int maxPlayers) throws Exception {
        return createRoom(host, gameType, maxPlayers, new HashMap<>());
    }

    // Create a new room with settings
    @Transactional
    public GameRoom createRoom(User host, String gameType, int maxPlayers, Map<String, Object> settings)
            throws Exception {
        GameRoom room = new GameRoom();
        room.setGameType(gameType);
        room.setInviteCode(generateInviteCode());
        room.setHost(host);
        room.setMaxPlayers(maxPlayers);
        room.setStatus("WAITING");

        // Initialize players list
        List<Map<String, Object>> players = new ArrayList<>();
        Map<String, Object> hostPlayer = new HashMap<>();
        hostPlayer.put("username", host.getUsername());
        hostPlayer.put("displayName", host.getDisplayName() != null ? host.getDisplayName() : host.getUsername());
        hostPlayer.put("joinedAt", LocalDateTime.now().toString());
        players.add(hostPlayer);

        room.setPlayers(objectMapper.writeValueAsString(players));
        room.setSessionWins("{}");
        room.setGamesPlayed(0);

        // Save settings (e.g. variant)
        if (settings == null)
            settings = new HashMap<>();
        room.setSettings(objectMapper.writeValueAsString(settings));

        return roomRepository.save(room);
    }

    // Join a room
    @Transactional
    public GameRoom joinRoom(String inviteCode, User user) throws Exception {
        GameRoom room = roomRepository.findByInviteCode(inviteCode.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!"WAITING".equals(room.getStatus())) {
            throw new RuntimeException("Game strictly in progress or finished");
        }

        List<Map<String, Object>> players = objectMapper.readValue(
                room.getPlayers(), new TypeReference<List<Map<String, Object>>>() {
                });

        // Check if full
        if (players.size() >= room.getMaxPlayers()) {
            throw new RuntimeException("Room is full");
        }

        // Check if already joined
        boolean alreadyJoined = players.stream()
                .anyMatch(p -> p.get("username").equals(user.getUsername()));

        if (!alreadyJoined) {
            Map<String, Object> newPlayer = new HashMap<>();
            newPlayer.put("username", user.getUsername());
            newPlayer.put("displayName", user.getDisplayName() != null ? user.getDisplayName() : user.getUsername());
            newPlayer.put("joinedAt", LocalDateTime.now().toString());
            players.add(newPlayer);
            room.setPlayers(objectMapper.writeValueAsString(players));
        }

        // Save the room first with the new player
        room = roomRepository.save(room);

        // Check if now full, if so, auto-start
        if (players.size() >= room.getMaxPlayers()) {
            User host = room.getHost();
            String gameType = room.getGameType().toLowerCase();

            // Normalize game type string if needed (Uno usually sends "UNO")
            if (gameType.equals("uno")) {
                return unoRoomService.startGame(room.getId(), host);
            } else if (gameType.equals("tictactoe")) {
                return ticTacToeRoomService.startGame(room.getId(), host);
            } else if (gameType.equals("connectfour")) {
                return connectFourRoomService.startGame(room.getId(), host);
            } else if (gameType.equals("checkers")) {
                return checkersRoomService.startGame(room.getId(), host);
            } else if (gameType.equals("chess")) {
                return chessRoomService.startGame(room.getId(), host);
            }
        }

        return room;
    }

    // Leave room
    @Transactional
    public GameRoom leaveRoom(Long roomId, User user) throws Exception {
        GameRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        List<Map<String, Object>> players = objectMapper.readValue(
                room.getPlayers(), new TypeReference<List<Map<String, Object>>>() {
                });

        players.removeIf(p -> p.get("username").equals(user.getUsername()));

        // If host leaves or no players left, close room
        if (players.isEmpty() || room.getHost().getUsername().equals(user.getUsername())) {
            roomRepository.delete(room);
            return null;
        }

        room.setPlayers(objectMapper.writeValueAsString(players));
        return roomRepository.save(room);
    }

    public GameRoom getRoom(Long roomId) {
        return roomRepository.findById(roomId).orElse(null);
    }

    public GameRoom getRoomByCode(String code) {
        return roomRepository.findByInviteCode(code).orElse(null);
    }

    private String generateInviteCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
