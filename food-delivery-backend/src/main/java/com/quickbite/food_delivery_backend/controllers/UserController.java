package com.quickbite.food_delivery_backend.controllers;

import com.quickbite.food_delivery_backend.models.User;
import com.quickbite.food_delivery_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    UserRepository userRepository;

    @GetMapping("/profile/{id}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('RESTAURANT') or hasRole('ADMIN') or hasRole('DELIVERY')")
    public ResponseEntity<?> getUserProfile(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    // Avoid sending password
                    user.setPassword(null);
                    return ResponseEntity.ok(user);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile/{id}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('RESTAURANT') or hasRole('ADMIN') or hasRole('DELIVERY')")
    public ResponseEntity<?> updateUserProfile(@PathVariable Long id, @RequestBody User userRequest) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setFullName(userRequest.getFullName());
                    // Email might be read-only or handled separately
                    user.setMobile(userRequest.getMobile());
                    user.setAvatarUrl(userRequest.getAvatarUrl());
                    user.setAddress(userRequest.getAddress());
                    
                    userRepository.save(user);
                    
                    // Don't return password
                    user.setPassword(null);
                    return ResponseEntity.ok(user);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
