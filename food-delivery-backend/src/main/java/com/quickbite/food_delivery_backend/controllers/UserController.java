package com.quickbite.food_delivery_backend.controllers;

import com.quickbite.food_delivery_backend.exception.ResourceNotFoundException;
import com.quickbite.food_delivery_backend.models.User;
import com.quickbite.food_delivery_backend.payload.request.UpdateProfileRequest;
import com.quickbite.food_delivery_backend.payload.response.UserResponse;
import com.quickbite.food_delivery_backend.repository.UserRepository;
import com.quickbite.food_delivery_backend.security.SecurityUtils;
import com.quickbite.food_delivery_backend.security.services.UserDetailsImpl;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "Self-service profile")
public class UserController {

    @Autowired
    UserRepository userRepository;

    /**
     * The id stays in the path so existing callers keep working, but it is now checked against
     * the JWT principal — previously any authenticated user could read any other profile.
     */
    @GetMapping("/profile/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Read a profile (self or admin)")
    public ResponseEntity<UserResponse> getUserProfile(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl principal) {

        SecurityUtils.requireSelfOrAdmin(principal, id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("User", id));
        return ResponseEntity.ok(UserResponse.from(user));
    }

    @PutMapping("/profile/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update a profile (self or admin)")
    public ResponseEntity<UserResponse> updateUserProfile(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal UserDetailsImpl principal) {

        SecurityUtils.requireSelfOrAdmin(principal, id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("User", id));

        // Only these four fields are updatable. Email, role and password are not part of the
        // request payload at all, so they cannot be overwritten from here.
        user.setFullName(request.getFullName());
        user.setMobile(request.getMobile());
        user.setAddress(request.getAddress());
        user.setAvatarUrl(request.getAvatarUrl());

        return ResponseEntity.ok(UserResponse.from(userRepository.save(user)));
    }
}
