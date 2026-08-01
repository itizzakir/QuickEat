package com.quickbite.food_delivery_backend.controllers;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.EnumSet;
import java.util.Set;

import com.quickbite.food_delivery_backend.exception.BadRequestException;
import com.quickbite.food_delivery_backend.exception.ResourceNotFoundException;
import com.quickbite.food_delivery_backend.models.*;
import com.quickbite.food_delivery_backend.payload.request.ChangePasswordRequest;
import com.quickbite.food_delivery_backend.payload.request.LoginRequest;
import com.quickbite.food_delivery_backend.payload.request.SignupRequest;
import com.quickbite.food_delivery_backend.payload.response.CurrentUserResponse;
import com.quickbite.food_delivery_backend.payload.response.JwtResponse;
import com.quickbite.food_delivery_backend.payload.response.MessageResponse;
import com.quickbite.food_delivery_backend.repository.AddressRepository;
import com.quickbite.food_delivery_backend.repository.UserRepository;
import com.quickbite.food_delivery_backend.repository.RestaurantRepository;
import com.quickbite.food_delivery_backend.repository.DeliveryInfoRepository;
import com.quickbite.food_delivery_backend.security.jwt.JwtUtils;
import com.quickbite.food_delivery_backend.security.services.UserDetailsImpl;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Auth", description = "Sign in, sign up, session and password")
public class AuthController {

  /**
   * Roles a member of the public may sign themselves up as. ROLE_ADMIN is deliberately absent:
   * this endpoint is unauthenticated, and the previous ERole.valueOf(...) let anyone mint
   * themselves an administrator by posting role: "ROLE_ADMIN".
   */
  private static final Set<ERole> SELF_SERVICE_ROLES =
      EnumSet.of(ERole.ROLE_CUSTOMER, ERole.ROLE_RESTAURANT, ERole.ROLE_DELIVERY);

  @Autowired
  AuthenticationManager authenticationManager;

  @Autowired
  UserRepository userRepository;
  
  @Autowired
  RestaurantRepository restaurantRepository;
  
  @Autowired
  DeliveryInfoRepository deliveryInfoRepository;

  @Autowired
  AddressRepository addressRepository;

  @Autowired
  PasswordEncoder encoder;

  @Autowired
  JwtUtils jwtUtils;

  @Operation(summary = "Sign in and receive a JWT")
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
                         role,
                         // Saves the restaurant dashboard a second round trip on login.
                         restaurantIdFor(userDetails.getId(), role)));
  }

  /** The restaurant a RESTAURANT account owns, or null for every other role. */
  private Long restaurantIdFor(Long userId, String role) {
    if (!ERole.ROLE_RESTAURANT.name().equals(role)) {
      return null;
    }
    return restaurantRepository.findByOwnerId(userId).stream()
        .findFirst()
        .map(Restaurant::getId)
        .orElse(null);
  }

  @GetMapping("/me")
  @PreAuthorize("isAuthenticated()")
  @Operation(summary = "The signed-in user, for revalidating a stored session on refresh")
  public ResponseEntity<CurrentUserResponse> currentUser(
      @AuthenticationPrincipal UserDetailsImpl principal) {

    User user = userRepository.findById(principal.getId())
        .orElseThrow(() -> ResourceNotFoundException.of("User", principal.getId()));

    Long restaurantId = user.getRole() == ERole.ROLE_RESTAURANT
        ? restaurantRepository.findByOwnerId(user.getId()).stream()
            .findFirst().map(Restaurant::getId).orElse(null)
        : null;

    return ResponseEntity.ok(CurrentUserResponse.of(user, restaurantId));
  }

  @PostMapping("/change-password")
  @PreAuthorize("isAuthenticated()")
  @Operation(summary = "Change the signed-in user's own password")
  public ResponseEntity<MessageResponse> changePassword(
      @Valid @RequestBody ChangePasswordRequest request,
      @AuthenticationPrincipal UserDetailsImpl principal) {

    User user = userRepository.findById(principal.getId())
        .orElseThrow(() -> ResourceNotFoundException.of("User", principal.getId()));

    // Verifying the current password stops a stolen token being used to lock the owner out.
    if (!encoder.matches(request.getCurrentPassword(), user.getPassword())) {
      throw new BadRequestException("Current password is incorrect");
    }
    if (encoder.matches(request.getNewPassword(), user.getPassword())) {
      throw new BadRequestException("New password must differ from the current one");
    }

    user.setPassword(encoder.encode(request.getNewPassword()));
    userRepository.save(user);

    return ResponseEntity.ok(new MessageResponse("Password updated successfully"));
  }

  @Operation(summary = "Public self-registration (customer, restaurant or delivery)")
  @PostMapping("/signup")
  public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
    if (userRepository.existsByEmail(signUpRequest.getEmail())) {
      return ResponseEntity
          .badRequest()
          .body(new MessageResponse("Error: Email is already in use!"));
    }

    // Determine Role — only the self-service roles are accepted.
    ERole role = ERole.ROLE_CUSTOMER;
    if (signUpRequest.getRole() != null && !signUpRequest.getRole().isBlank()) {
        ERole requested;
        try {
            requested = ERole.valueOf(signUpRequest.getRole().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Unknown role: " + signUpRequest.getRole());
        }
        if (!SELF_SERVICE_ROLES.contains(requested)) {
            throw new BadRequestException(
                "Role " + requested + " cannot be self-registered");
        }
        role = requested;
    }

        // Signup fields are kept as a structured Address row below; this string is only the
    // denormalised copy on User, kept in step so existing screens keep working.
    Address signupAddress = null;
    String address = null;
    if (signUpRequest.getAddressLine1() != null && !signUpRequest.getAddressLine1().isBlank()) {
        signupAddress = new Address();
        signupAddress.setLabel("Home");
        signupAddress.setLine1(signUpRequest.getAddressLine1());
        signupAddress.setCity(signUpRequest.getCity());
        signupAddress.setState(signUpRequest.getState());
        signupAddress.setPostalCode(signUpRequest.getPostalCode());
        signupAddress.setCountry(signUpRequest.getCountry());
        signupAddress.setIsDefault(Boolean.TRUE);
        address = signupAddress.toFormattedString();
    }

    User user = new User(signUpRequest.getFullName(), 
               signUpRequest.getEmail(),
               encoder.encode(signUpRequest.getPassword()),
               role);
    
    user.setMobile(signUpRequest.getMobile());
    user.setAddress(address);
    user.setAvatarUrl(signUpRequest.getImageUrl()); // Use image URL as avatar for now

    User savedUser = userRepository.save(user);

    if (signupAddress != null) {
        signupAddress.setUser(savedUser);
        addressRepository.save(signupAddress);
    }

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
