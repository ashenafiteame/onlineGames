package com.example.backend.service;

import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setPassword("password");
        user.setRole("USER");
    }

    @Test
    void registerUser_Success() {
        // Arrange
        when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(user.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        User registeredUser = userService.registerUser(user);

        // Assert
        assertNotNull(registeredUser);
        assertEquals("encodedPassword", registeredUser.getPassword());
        assertEquals("USER", registeredUser.getRole());
        assertEquals(1, registeredUser.getLevel());
        assertEquals(0, registeredUser.getTotalScore());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void registerUser_UsernameExists_ThrowsException() {
        // Arrange
        when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));

        // Act & Assert
        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            userService.registerUser(user);
        });

        assertEquals("Username already exists", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void toggleUserRole_ToAdmin() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        User result = userService.toggleUserRole(1L);

        // Assert
        assertEquals("ADMIN", result.getRole());
    }

    @Test
    void toggleUserRole_ToUser() {
        // Arrange
        user.setRole("ADMIN");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        User result = userService.toggleUserRole(1L);

        // Assert
        assertEquals("USER", result.getRole());
    }

    @Test
    void toggleUserRole_NotFound_ThrowsException() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            userService.toggleUserRole(1L);
        });
    }
}
