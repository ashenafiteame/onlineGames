package com.example.backend.repository;

import com.example.backend.entity.FriendRequest;
import com.example.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {
    List<FriendRequest> findByReceiverAndStatus(User receiver, FriendRequest.RequestStatus status);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM FriendRequest fr WHERE fr.sender = :user OR fr.receiver = :user")
    void deleteByAnyUser(@org.springframework.data.repository.query.Param("user") User user);

    Optional<FriendRequest> findBySenderAndReceiverAndStatus(User sender, User receiver,
            FriendRequest.RequestStatus status);
}
