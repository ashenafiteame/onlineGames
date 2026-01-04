package com.example.backend.repository;

import com.example.backend.entity.UnoRoom;
import com.example.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UnoRoomRepository extends JpaRepository<UnoRoom, Long> {
    Optional<UnoRoom> findByInviteCode(String inviteCode);

    List<UnoRoom> findByHost(User host);

    List<UnoRoom> findByStatus(String status);

    // Find rooms where the user is a player (checks JSON players array)
    @Query("SELECT r FROM UnoRoom r WHERE r.players LIKE %:username%")
    List<UnoRoom> findRoomsContainingPlayer(String username);

    // Delete old rooms (for cleanup)
    void deleteByLastActivityAtBefore(LocalDateTime dateTime);

    // Find active rooms (not finished) by host
    List<UnoRoom> findByHostAndStatusNot(User host, String status);
}
