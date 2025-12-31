package com.example.backend.service;

import com.example.backend.entity.Activity;
import com.example.backend.entity.FriendRequest;
import com.example.backend.entity.Friendship;
import com.example.backend.entity.User;
import com.example.backend.repository.ActivityRepository;
import com.example.backend.repository.FriendRequestRepository;
import com.example.backend.repository.FriendshipRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SocialService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendRequestRepository friendRequestRepository;

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Transactional
    public void sendFriendRequest(User sender, String receiverUsername) {
        User receiver = userRepository.findByUsername(receiverUsername)
                .orElseThrow(() -> new RuntimeException("User not found: " + receiverUsername));

        if (sender.getId().equals(receiver.getId())) {
            throw new RuntimeException("Cannot add yourself");
        }

        if (friendRequestRepository
                .findBySenderAndReceiverAndStatus(sender, receiver, FriendRequest.RequestStatus.PENDING).isPresent()) {
            throw new RuntimeException("Request already pending");
        }

        if (friendshipRepository.findByUsers(sender, receiver).isPresent()) {
            throw new RuntimeException("Already friends");
        }

        FriendRequest request = new FriendRequest(null, sender, receiver, FriendRequest.RequestStatus.PENDING,
                LocalDateTime.now());
        friendRequestRepository.save(request);
    }

    @Transactional
    public void acceptFriendRequest(User receiver, Long requestId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!request.getReceiver().getId().equals(receiver.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        if (friendshipRepository.findByUsers(request.getSender(), request.getReceiver()).isPresent()) {
            request.setStatus(FriendRequest.RequestStatus.ACCEPTED);
            friendRequestRepository.save(request);
            return; // Already friends, just close the request
        }

        request.setStatus(FriendRequest.RequestStatus.ACCEPTED);
        friendRequestRepository.save(request);

        Friendship friendship = new Friendship(null, request.getSender(), request.getReceiver(), LocalDateTime.now());
        friendshipRepository.save(friendship);

        logActivity(request.getSender(), "FRIEND_ADDED", "is now friends with " + request.getReceiver().getUsername());
        logActivity(request.getReceiver(), "FRIEND_ADDED", "is now friends with " + request.getSender().getUsername());
    }

    public List<FriendRequest> getPendingRequests(User user) {
        return friendRequestRepository.findByReceiverAndStatus(user, FriendRequest.RequestStatus.PENDING);
    }

    public List<User> getFriends(User user) {
        return friendshipRepository.findByAnyUser(user).stream()
                .map(f -> f.getUser1().getId().equals(user.getId()) ? f.getUser2() : f.getUser1())
                .collect(Collectors.toList());
    }

    @Transactional
    public void logActivity(User user, String type, String content) {
        Activity activity = new Activity(null, user, type, content, LocalDateTime.now());
        activityRepository.save(activity);
    }

    @Transactional
    public void unfriend(User user, String friendUsername) {
        User friend = userRepository.findByUsername(friendUsername)
                .orElseThrow(() -> new RuntimeException("User not found: " + friendUsername));

        friendshipRepository.deleteByUsers(user, friend);

        logActivity(user, "UNFRIEND", "is no longer friends with " + friend.getUsername());
        logActivity(friend, "UNFRIEND", "is no longer friends with " + user.getUsername());
    }

    public List<Activity> getGlobalFeed() {
        return activityRepository.findTop50ByOrderByCreatedAtDesc();
    }

    public boolean areFriends(User user1, User user2) {
        return friendshipRepository.findByUsers(user1, user2).isPresent();
    }
}
