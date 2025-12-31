package com.example.backend.service;

import com.example.backend.entity.Activity;
import com.example.backend.entity.FriendRequest;
import com.example.backend.entity.Friendship;
import com.example.backend.entity.User;
import com.example.backend.repository.ActivityRepository;
import com.example.backend.repository.FriendRequestRepository;
import com.example.backend.repository.FriendshipRepository;
import com.example.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SocialServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private FriendRequestRepository friendRequestRepository;

    @Mock
    private FriendshipRepository friendshipRepository;

    @Mock
    private ActivityRepository activityRepository;

    @InjectMocks
    private SocialService socialService;

    private User sender;
    private User receiver;

    @BeforeEach
    void setUp() {
        sender = new User();
        sender.setId(1L);
        sender.setUsername("sender");

        receiver = new User();
        receiver.setId(2L);
        receiver.setUsername("receiver");
    }

    @Test
    void sendFriendRequest_Success() {
        // Arrange
        when(userRepository.findByUsername("receiver")).thenReturn(Optional.of(receiver));
        when(friendRequestRepository.findBySenderAndReceiverAndStatus(any(), any(), any()))
                .thenReturn(Optional.empty());

        // Act
        socialService.sendFriendRequest(sender, "receiver");

        // Assert
        verify(friendRequestRepository, times(1)).save(any(FriendRequest.class));
    }

    @Test
    void sendFriendRequest_Self_ThrowsException() {
        // Arrange
        when(userRepository.findByUsername("sender")).thenReturn(Optional.of(sender));

        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            socialService.sendFriendRequest(sender, "sender");
        });

        assertEquals("Cannot add yourself", exception.getMessage());
    }

    @Test
    void acceptFriendRequest_Success() {
        // Arrange
        FriendRequest request = new FriendRequest(1L, sender, receiver, FriendRequest.RequestStatus.PENDING, null);
        when(friendRequestRepository.findById(1L)).thenReturn(Optional.of(request));

        // Act
        socialService.acceptFriendRequest(receiver, 1L);

        // Assert
        assertEquals(FriendRequest.RequestStatus.ACCEPTED, request.getStatus());
        verify(friendshipRepository, times(1)).save(any(Friendship.class));
        verify(activityRepository, times(2)).save(any(Activity.class));
    }
}
