package com.quickbite.food_delivery_backend.controllers;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.quickbite.food_delivery_backend.models.*;
import com.quickbite.food_delivery_backend.payload.request.LoginRequest;
import com.quickbite.food_delivery_backend.payload.request.SignupRequest;
import com.quickbite.food_delivery_backend.payload.response.JwtResponse;
import com.quickbite.food_delivery_backend.payload.response.MessageResponse;
import com.quickbite.food_delivery_backend.repository.UserRepository;
import com.quickbite.food_delivery_backend.repository.RestaurantRepository;
import com.quickbite.food_delivery_backend.repository.DeliveryInfoRepository;
import com.quickbite.food_delivery_backend.security.jwt.JwtUtils;
import com.quickbite.food_delivery_backend.security.services.UserDetailsImpl;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
  @Autowired
  AuthenticationManager authenticationManager;

  @Autowired
  UserRepository userRepository;
  
  @Autowired
  RestaurantRepository restaurantRepository;
  
  @Autowired
  DeliveryInfoRepository deliveryInfoRepository;

  @Autowired
  PasswordEncoder encoder;

  @Autowired
  JwtUtils jwtUtils;

  @PostMapping("/signin")
  public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {

    Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

    SecurityContextHolder.getContext().setAuthentication(authentication);
    String jwt = jwtUtils.generateJwtToken(authentication);
    
    UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();    
    String role = userDetails.getAuthorities().stream()
        .findFirst()
        .map(item -> item.getAuthority())
        .orElse(null);

    return ResponseEntity.ok(new JwtResponse(jwt, 
                         userDetails.getId(), 
                         userDetails.getFullName(), 
                         userDetails.getEmail(), 
                         role));
  }

  @PostMapping("/signup")
  public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
    if (userRepository.existsByEmail(signUpRequest.getEmail())) {
      return ResponseEntity
          .badRequest()
          .body(new MessageResponse("Error: Email is already in use!"));
    }

    // Determine Role
    ERole role = ERole.ROLE_CUSTOMER;
    if (signUpRequest.getRole() != null) {
        try {
            role = ERole.valueOf(signUpRequest.getRole());
        } catch (IllegalArgumentException e) {
             // Default to customer
        }
    }

    // Construct Address String
    String address = null;
    if (signUpRequest.getAddressLine1() != null) {
        address = signUpRequest.getAddressLine1() + ", " + 
                  signUpRequest.getCity() + ", " + 
                  signUpRequest.getState() + " - " + 
                  signUpRequest.getPostalCode() + ", " + 
                  signUpRequest.getCountry();
    }

    User user = new User(signUpRequest.getFullName(), 
               signUpRequest.getEmail(),
               encoder.encode(signUpRequest.getPassword()),
               role);
    
    user.setMobile(signUpRequest.getMobile());
    user.setAddress(address);
    user.setAvatarUrl(signUpRequest.getImageUrl()); // Use image URL as avatar for now

    User savedUser = userRepository.save(user);

    // Handle Role Specific Data
    if (role == ERole.ROLE_RESTAURANT) {
        Restaurant restaurant = new Restaurant();
        restaurant.setName(signUpRequest.getBusinessName());
        restaurant.setDescription(signUpRequest.getCategories()); // Using categories as description for now
        restaurant.setImage(signUpRequest.getImageUrl());
        restaurant.setAddress(address);
        restaurant.setOwner(savedUser);
        restaurant.setCategory(signUpRequest.getCategories());
        restaurant.setRating(0.0); // Default
        
        // We might want to set contact info on restaurant too, but User has mobile/email
        restaurantRepository.save(restaurant);
        
    } else if (role == ERole.ROLE_DELIVERY) {
        DeliveryInfo deliveryInfo = new DeliveryInfo(
            savedUser,
            signUpRequest.getVehicleType(),
            signUpRequest.getVehicleModel(),
            signUpRequest.getLicenseNumber(),
            signUpRequest.getVehicleRegistrationNumber(),
            signUpRequest.getDeliveryZone(),
            signUpRequest.getIdProofUrl()
        );
        deliveryInfoRepository.save(deliveryInfo);
    }

    return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
  }
}
