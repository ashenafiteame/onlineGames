package com.example.backend.repository;

import com.example.backend.entity.GameRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameRoomRepository extends JpaRepository<GameRoom, Long> {
    Optional<GameRoom> findByInviteCode(String inviteCode);

    @Query(value = "SELECT * FROM game_rooms WHERE players LIKE %:username% AND status != 'FINISHED'", nativeQuery = true)
    List<GameRoom> findActiveRoomsByPlayer(String username);

    List<GameRoom> findByStatus(String status);
}
