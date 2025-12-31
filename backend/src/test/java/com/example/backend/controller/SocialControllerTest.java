package com.example.backend.controller;

import com.example.backend.entity.User;
import com.example.backend.service.SocialService;
import com.example.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.security.Principal;
import java.util.Collections;
import java.util.Optional;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SocialControllerTest {

    private MockMvc mockMvc;

    @Mock
    private SocialService socialService;

    @Mock
    private UserService userService;

    @InjectMocks
    private SocialController socialController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(socialController).build();
    }

    @Test
    void sendRequest_Success() throws Exception {
        // Arrange
        Principal principal = mock(Principal.class);
        when(principal.getName()).thenReturn("sender");
        User sender = new User();
        sender.setUsername("sender");

        when(userService.findByUsername("sender")).thenReturn(Optional.of(sender));

        // Act & Assert
        mockMvc.perform(post("/api/social/request/receiver")
                .principal(principal))
                .andExpect(status().isOk())
                .andExpect(content().string("Request sent"));
    }

    @Test
    void getFriends_ReturnsList() throws Exception {
        // Arrange
        Principal principal = mock(Principal.class);
        when(principal.getName()).thenReturn("testuser");
        User user = new User();
        user.setUsername("testuser");

        when(userService.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(socialService.getFriends(user)).thenReturn(Collections.emptyList());

        // Act & Assert
        mockMvc.perform(get("/api/social/friends").principal(principal))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }
}
