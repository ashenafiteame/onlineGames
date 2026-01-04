package com.example.backend.service;

import com.example.backend.entity.UnoRoom;
import com.example.backend.entity.User;
import com.example.backend.repository.UnoRoomRepository;
import com.example.backend.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class UnoRoomService {

    @Autowired
    private UnoRoomRepository unoRoomRepository;

    @Autowired
    private UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private final SecureRandom random = new SecureRandom();

    // Create a new UNO room
    @Transactional
    public UnoRoom createRoom(User host, int maxPlayers) {
        if (maxPlayers < 2 || maxPlayers > 6) {
            throw new RuntimeException("UNO requires 2-6 players");
        }

        UnoRoom room = new UnoRoom();
        room.setHost(host);
        room.setInviteCode(generateInviteCode());
        room.setStatus("WAITING");
        room.setMaxPlayers(maxPlayers);
        room.setLastActivityAt(LocalDateTime.now());

        // Initialize players with host
        List<Map<String, Object>> players = new ArrayList<>();
        Map<String, Object> hostPlayer = new HashMap<>();
        hostPlayer.put("username", host.getUsername());
        hostPlayer.put("displayName", host.getDisplayName() != null ? host.getDisplayName() : host.getUsername());
        hostPlayer.put("joinedAt", LocalDateTime.now().toString());
        hostPlayer.put("isHost", true);
        players.add(hostPlayer);

        try {
            room.setPlayers(objectMapper.writeValueAsString(players));
            room.setSessionWins(objectMapper.writeValueAsString(new HashMap<String, Integer>()));
            room.setGamesPlayed(0);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize players");
        }

        return unoRoomRepository.save(room);
    }

    // Generate unique 6-character invite code
    private String generateInviteCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(INVITE_CHARS.charAt(random.nextInt(INVITE_CHARS.length())));
            }
            code = sb.toString();
        } while (unoRoomRepository.findByInviteCode(code).isPresent());
        return code;
    }

    // Join a room by invite code
    @Transactional
    public UnoRoom joinRoom(String inviteCode, User user) throws JsonProcessingException {
        UnoRoom room = unoRoomRepository.findByInviteCode(inviteCode.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!"WAITING".equals(room.getStatus())) {
            throw new RuntimeException("Game has already started");
        }

        List<Map<String, Object>> players = objectMapper.readValue(
                room.getPlayers(), new TypeReference<List<Map<String, Object>>>() {
                });

        // Check if already in room
        boolean alreadyJoined = players.stream()
                .anyMatch(p -> user.getUsername().equals(p.get("username")));
        if (alreadyJoined) {
            return room; // Already in, just return current state
        }

        if (players.size() >= room.getMaxPlayers()) {
            throw new RuntimeException("Room is full");
        }

        // Add player
        Map<String, Object> newPlayer = new HashMap<>();
        newPlayer.put("username", user.getUsername());
        newPlayer.put("displayName", user.getDisplayName() != null ? user.getDisplayName() : user.getUsername());
        newPlayer.put("joinedAt", LocalDateTime.now().toString());
        newPlayer.put("isHost", false);
        players.add(newPlayer);

        room.setPlayers(objectMapper.writeValueAsString(players));
        room.setLastActivityAt(LocalDateTime.now());
        return unoRoomRepository.save(room);
    }

    // Leave a room
    @Transactional
    public UnoRoom leaveRoom(Long roomId, User user) throws JsonProcessingException {
        UnoRoom room = unoRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        List<Map<String, Object>> players = objectMapper.readValue(
                room.getPlayers(), new TypeReference<List<Map<String, Object>>>() {
                });

        players.removeIf(p -> user.getUsername().equals(p.get("username")));

        // If host leaves, either transfer or close room
        if (room.getHost().getUsername().equals(user.getUsername())) {
            if (players.isEmpty()) {
                unoRoomRepository.delete(room);
                return null;
            }
            // Transfer host to next player
            String newHostUsername = (String) players.get(0).get("username");
            User newHost = userRepository.findByUsername(newHostUsername).orElse(null);
            if (newHost != null) {
                room.setHost(newHost);
                players.get(0).put("isHost", true);
            }
        }

        room.setPlayers(objectMapper.writeValueAsString(players));
        room.setLastActivityAt(LocalDateTime.now());
        return unoRoomRepository.save(room);
    }

    // Start the game
    @Transactional
    public UnoRoom startGame(Long roomId, User user) throws JsonProcessingException {
        UnoRoom room = unoRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!room.getHost().getUsername().equals(user.getUsername())) {
            throw new RuntimeException("Only the host can start the game");
        }

        List<Map<String, Object>> players = objectMapper.readValue(
                room.getPlayers(), new TypeReference<List<Map<String, Object>>>() {
                });

        if (players.size() < 1) {
            throw new RuntimeException("Need at least 1 player to start");
        }

        // Initialize game state
        Map<String, Object> gameState = initializeGameState(players);
        room.setGameState(objectMapper.writeValueAsString(gameState));
        room.setStatus("PLAYING");
        room.setCurrentPlayerIndex(0);
        room.setCurrentPlayerUsername((String) players.get(0).get("username"));
        room.setLastActivityAt(LocalDateTime.now());

        return unoRoomRepository.save(room);
    }

    // Initialize UNO game state
    private Map<String, Object> initializeGameState(List<Map<String, Object>> players) {
        Map<String, Object> gameState = new HashMap<>();

        // Create deck
        List<Map<String, Object>> deck = createDeck();
        Collections.shuffle(deck);

        // Deal 7 cards to each player
        Map<String, List<Map<String, Object>>> hands = new HashMap<>();
        for (Map<String, Object> player : players) {
            String username = (String) player.get("username");
            List<Map<String, Object>> hand = new ArrayList<>();
            for (int i = 0; i < 7; i++) {
                hand.add(deck.remove(deck.size() - 1));
            }
            hands.put(username, hand);
        }

        // Find starting card (not wild)
        Map<String, Object> startCard;
        do {
            startCard = deck.remove(deck.size() - 1);
        } while ("Black".equals(startCard.get("color")));

        List<Map<String, Object>> discardPile = new ArrayList<>();
        discardPile.add(startCard);

        gameState.put("hands", hands);
        gameState.put("deck", deck);
        gameState.put("discardPile", discardPile);
        gameState.put("currentColor", startCard.get("color"));
        gameState.put("direction", 1); // 1 = clockwise, -1 = counter-clockwise
        gameState.put("winners", new ArrayList<>());
        gameState.put("drawPending", 0);

        return gameState;
    }

    // Create UNO deck
    private List<Map<String, Object>> createDeck() {
        List<Map<String, Object>> deck = new ArrayList<>();
        String[] colors = { "Red", "Blue", "Green", "Yellow" };

        for (String color : colors) {
            // One 0 per color
            deck.add(createCard(color, "0"));
            // Two of each 1-9
            for (int i = 1; i <= 9; i++) {
                deck.add(createCard(color, String.valueOf(i)));
                deck.add(createCard(color, String.valueOf(i)));
            }
            // Two of each special
            for (String special : new String[] { "Skip", "Reverse", "Draw Two" }) {
                deck.add(createCard(color, special));
                deck.add(createCard(color, special));
            }
        }

        // 4 Wild and 4 Wild Draw Four
        for (int i = 0; i < 4; i++) {
            deck.add(createCard("Black", "Wild"));
            deck.add(createCard("Black", "Wild Draw Four"));
        }

        return deck;
    }

    private Map<String, Object> createCard(String color, String value) {
        Map<String, Object> card = new HashMap<>();
        card.put("color", color);
        card.put("value", value);
        card.put("id", UUID.randomUUID().toString());
        return card;
    }

    // Play a card
    @Transactional
    public UnoRoom playCard(Long roomId, User user, String cardId, String chosenColor) throws JsonProcessingException {
        UnoRoom room = unoRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!"PLAYING".equals(room.getStatus())) {
            throw new RuntimeException("Game is not active");
        }

        if (!user.getUsername().equals(room.getCurrentPlayerUsername())) {
            throw new RuntimeException("Not your turn");
        }

        Map<String, Object> gameState = objectMapper.readValue(
                room.getGameState(), new TypeReference<Map<String, Object>>() {
                });

        @SuppressWarnings("unchecked")
        Map<String, List<Map<String, Object>>> hands = (Map<String, List<Map<String, Object>>>) gameState.get("hands");

        List<Map<String, Object>> hand = hands.get(user.getUsername());

        // Find the card
        Map<String, Object> playedCard = null;
        int cardIndex = -1;
        for (int i = 0; i < hand.size(); i++) {
            if (cardId.equals(hand.get(i).get("id"))) {
                playedCard = hand.get(i);
                cardIndex = i;
                break;
            }
        }

        if (playedCard == null) {
            throw new RuntimeException("Card not in hand");
        }

        // Validate move
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> discardPile = (List<Map<String, Object>>) gameState.get("discardPile");
        Map<String, Object> topCard = discardPile.get(discardPile.size() - 1);
        String currentColor = (String) gameState.get("currentColor");

        if (!isValidMove(playedCard, topCard, currentColor)) {
            throw new RuntimeException("Invalid move");
        }

        // Remove card from hand
        hand.remove(cardIndex);

        // Add to discard pile
        discardPile.add(playedCard);

        // Handle special cards
        String newColor = playedCard.get("color").equals("Black") && chosenColor != null
                ? chosenColor
                : (String) playedCard.get("color");
        gameState.put("currentColor", newColor);

        int direction = (int) gameState.get("direction");
        List<Map<String, Object>> players = objectMapper.readValue(
                room.getPlayers(), new TypeReference<List<Map<String, Object>>>() {
                });
        int playerCount = players.size();
        int currentIndex = room.getCurrentPlayerIndex();

        String cardValue = (String) playedCard.get("value");
        int skip = 0;
        int drawAmount = 0;

        switch (cardValue) {
            case "Skip":
                skip = 1;
                break;
            case "Reverse":
                direction = -direction;
                gameState.put("direction", direction);
                if (playerCount == 2)
                    skip = 1; // In 2-player, Reverse acts like Skip
                break;
            case "Draw Two":
                drawAmount = 2;
                skip = 1; // Skip their turn after they draw
                break;
            case "Wild Draw Four":
                drawAmount = 4;
                skip = 1;
                break;
        }

        // Check for win
        @SuppressWarnings("unchecked")
        List<String> winners = (List<String>) gameState.get("winners");
        if (hand.isEmpty()) {
            winners.add(user.getUsername());
            gameState.put("winners", winners);
        }

        // Calculate next player
        int nextIndex = (currentIndex + direction * (1 + skip) + playerCount) % playerCount;

        // Handle draw for next player
        if (drawAmount > 0) {
            int victimIndex = (currentIndex + direction + playerCount) % playerCount;
            String victimUsername = (String) players.get(victimIndex).get("username");
            drawCardsForPlayer(gameState, victimUsername, drawAmount);
        }

        // Check if all but one player has won
        int remainingPlayers = 0;
        String lastPlayer = null;
        for (Map<String, Object> player : players) {
            String username = (String) player.get("username");
            if (!winners.contains(username) && !hands.get(username).isEmpty()) {
                remainingPlayers++;
                lastPlayer = username;
            }
        }

        if (remainingPlayers <= 1) {
            if (lastPlayer != null && !winners.contains(lastPlayer)) {
                winners.add(lastPlayer);
            }
            room.setStatus("FINISHED");

            // Update session wins for the winner (first in winners list)
            if (!winners.isEmpty()) {
                String winner = winners.get(0);
                Map<String, Integer> sessionWins = objectMapper.readValue(
                        room.getSessionWins() != null ? room.getSessionWins() : "{}",
                        new TypeReference<Map<String, Integer>>() {
                        });
                sessionWins.put(winner, sessionWins.getOrDefault(winner, 0) + 1);
                room.setSessionWins(objectMapper.writeValueAsString(sessionWins));
            }
            room.setGamesPlayed(room.getGamesPlayed() != null ? room.getGamesPlayed() + 1 : 1);
        }

        // Update game state
        room.setGameState(objectMapper.writeValueAsString(gameState));
        room.setCurrentPlayerIndex(nextIndex);
        room.setCurrentPlayerUsername((String) players.get(nextIndex).get("username"));
        room.setLastActivityAt(LocalDateTime.now());

        return unoRoomRepository.save(room);
    }

    // Draw a card
    @Transactional
    public UnoRoom drawCard(Long roomId, User user) throws JsonProcessingException {
        UnoRoom room = unoRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!"PLAYING".equals(room.getStatus())) {
            throw new RuntimeException("Game is not active");
        }

        if (!user.getUsername().equals(room.getCurrentPlayerUsername())) {
            throw new RuntimeException("Not your turn");
        }

        Map<String, Object> gameState = objectMapper.readValue(
                room.getGameState(), new TypeReference<Map<String, Object>>() {
                });

        drawCardsForPlayer(gameState, user.getUsername(), 1);

        // Move to next player
        List<Map<String, Object>> players = objectMapper.readValue(
                room.getPlayers(), new TypeReference<List<Map<String, Object>>>() {
                });
        int direction = (int) gameState.get("direction");
        int playerCount = players.size();
        int currentIndex = room.getCurrentPlayerIndex();
        int nextIndex = (currentIndex + direction + playerCount) % playerCount;

        room.setGameState(objectMapper.writeValueAsString(gameState));
        room.setCurrentPlayerIndex(nextIndex);
        room.setCurrentPlayerUsername((String) players.get(nextIndex).get("username"));
        room.setLastActivityAt(LocalDateTime.now());

        return unoRoomRepository.save(room);
    }

    @SuppressWarnings("unchecked")
    private void drawCardsForPlayer(Map<String, Object> gameState, String username, int count) {
        List<Map<String, Object>> deck = (List<Map<String, Object>>) gameState.get("deck");
        List<Map<String, Object>> discardPile = (List<Map<String, Object>>) gameState.get("discardPile");
        Map<String, List<Map<String, Object>>> hands = (Map<String, List<Map<String, Object>>>) gameState.get("hands");

        List<Map<String, Object>> hand = hands.get(username);

        for (int i = 0; i < count; i++) {
            if (deck.isEmpty()) {
                // Reshuffle discard pile into deck
                if (discardPile.size() <= 1)
                    break;
                Map<String, Object> topCard = discardPile.remove(discardPile.size() - 1);
                deck.addAll(discardPile);
                discardPile.clear();
                discardPile.add(topCard);
                Collections.shuffle(deck);
            }
            if (!deck.isEmpty()) {
                hand.add(deck.remove(deck.size() - 1));
            }
        }
    }

    private boolean isValidMove(Map<String, Object> card, Map<String, Object> topCard, String currentColor) {
        String cardColor = (String) card.get("color");
        String cardValue = (String) card.get("value");
        String topValue = (String) topCard.get("value");

        // Wild cards can always be played
        if ("Black".equals(cardColor))
            return true;

        // Match color or value
        return cardColor.equals(currentColor) || cardValue.equals(topValue);
    }

    // Get room by ID
    public UnoRoom getRoom(Long roomId) {
        return unoRoomRepository.findById(roomId).orElse(null);
    }

    // Get room by invite code
    public UnoRoom getRoomByInviteCode(String code) {
        return unoRoomRepository.findByInviteCode(code.toUpperCase()).orElse(null);
    }

    // Get user's active rooms
    public List<UnoRoom> getUserActiveRooms(User user) {
        return unoRoomRepository.findRoomsContainingPlayer(user.getUsername());
    }

    // Play again - reset game state but keep players and session stats
    @Transactional
    public UnoRoom playAgain(Long roomId, User user) throws JsonProcessingException {
        UnoRoom room = unoRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!room.getHost().getUsername().equals(user.getUsername())) {
            throw new RuntimeException("Only the host can restart the game");
        }

        if (!"FINISHED".equals(room.getStatus())) {
            throw new RuntimeException("Game must be finished to play again");
        }

        List<Map<String, Object>> players = objectMapper.readValue(
                room.getPlayers(), new TypeReference<List<Map<String, Object>>>() {
                });

        // Initialize new game state with same players
        Map<String, Object> gameState = initializeGameState(players);
        room.setGameState(objectMapper.writeValueAsString(gameState));
        room.setStatus("PLAYING");
        room.setCurrentPlayerIndex(0);
        room.setCurrentPlayerUsername((String) players.get(0).get("username"));
        room.setLastActivityAt(LocalDateTime.now());

        return unoRoomRepository.save(room);
    }
}
