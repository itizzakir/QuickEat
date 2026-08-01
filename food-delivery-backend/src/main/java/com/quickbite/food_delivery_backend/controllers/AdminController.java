package com.quickbite.food_delivery_backend.controllers;

import com.quickbite.food_delivery_backend.exception.BadRequestException;
import com.quickbite.food_delivery_backend.exception.ConflictException;
import com.quickbite.food_delivery_backend.exception.ResourceNotFoundException;
import com.quickbite.food_delivery_backend.models.*;
import com.quickbite.food_delivery_backend.payload.request.AdminUserRequest;
import com.quickbite.food_delivery_backend.payload.request.ApprovedRequest;
import com.quickbite.food_delivery_backend.payload.request.EnabledRequest;
import com.quickbite.food_delivery_backend.payload.response.*;
import com.quickbite.food_delivery_backend.repository.*;
import com.quickbite.food_delivery_backend.security.services.UserDetailsImpl;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "User, restaurant and platform administration")
public class AdminController {

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final OrderRepository orderRepository;
    private final DeliveryInfoRepository deliveryInfoRepository;
    private final CartRepository cartRepository;
    private final AddressRepository addressRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminController(UserRepository userRepository,
                           RestaurantRepository restaurantRepository,
                           OrderRepository orderRepository,
                           DeliveryInfoRepository deliveryInfoRepository,
                           CartRepository cartRepository,
                           AddressRepository addressRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.restaurantRepository = restaurantRepository;
        this.orderRepository = orderRepository;
        this.deliveryInfoRepository = deliveryInfoRepository;
        this.cartRepository = cartRepository;
        this.addressRepository = addressRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ------------------------------------------------------------------ users

    @GetMapping("/users")
    @Operation(summary = "Paged user directory, filterable by role and free-text search")
    public PageResponse<UserResponse> listUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        ERole roleFilter = parseRole(role, true);
        String term = (search == null || search.isBlank()) ? null : search.trim();

        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.ASC, "id"));

        return PageResponse.of(userRepository.search(roleFilter, term, pageable),
                UserResponse::from);
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "Fetch one user")
    public UserResponse getUser(@PathVariable Long id) {
        return UserResponse.from(loadUser(id));
    }

    @PostMapping("/users")
    @Operation(summary = "Create a user with any role, including ADMIN")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody AdminUserRequest request) {
        if (Boolean.TRUE.equals(userRepository.existsByEmail(request.getEmail()))) {
            throw new ConflictException("Email is already in use");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BadRequestException("password is required when creating a user");
        }
        requireValidPasswordLength(request.getPassword());

        User user = new User(request.getFullName(), request.getEmail(),
                passwordEncoder.encode(request.getPassword()), parseRole(request.getRole(), false));
        user.setMobile(request.getMobile());
        user.setAddress(request.getAddress());
        user.setAvatarUrl(request.getAvatarUrl());
        user.setEnabled(request.getEnabled() == null || request.getEnabled());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(UserResponse.from(userRepository.save(user)));
    }

    @PutMapping("/users/{id}")
    @Operation(summary = "Update a user; a blank password leaves the existing one untouched")
    public UserResponse updateUser(@PathVariable Long id,
                                   @Valid @RequestBody AdminUserRequest request,
                                   @AuthenticationPrincipal UserDetailsImpl principal) {
        User user = loadUser(id);
        ERole newRole = parseRole(request.getRole(), false);

        // Demoting yourself out of ADMIN is the same lockout risk as deleting yourself.
        if (user.getId().equals(principal.getId()) && newRole != ERole.ROLE_ADMIN) {
            throw new BadRequestException("You cannot change your own role");
        }
        if (user.getRole() == ERole.ROLE_ADMIN && newRole != ERole.ROLE_ADMIN) {
            requireAnotherAdminExists(user.getId(), "demote the last remaining admin");
        }
        if (!user.getEmail().equalsIgnoreCase(request.getEmail())
                && Boolean.TRUE.equals(userRepository.existsByEmail(request.getEmail()))) {
            throw new ConflictException("Email is already in use");
        }

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setRole(newRole);
        user.setMobile(request.getMobile());
        user.setAddress(request.getAddress());
        user.setAvatarUrl(request.getAvatarUrl());
        if (request.getEnabled() != null) {
            if (user.getId().equals(principal.getId()) && !request.getEnabled()) {
                throw new BadRequestException("You cannot disable your own account");
            }
            user.setEnabled(request.getEnabled());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            requireValidPasswordLength(request.getPassword());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return UserResponse.from(userRepository.save(user));
    }

    @PatchMapping("/users/{id}/enabled")
    @Operation(summary = "Suspend or reinstate an account")
    public UserResponse setEnabled(@PathVariable Long id,
                                   @Valid @RequestBody EnabledRequest request,
                                   @AuthenticationPrincipal UserDetailsImpl principal) {
        User user = loadUser(id);

        if (user.getId().equals(principal.getId()) && !request.getEnabled()) {
            throw new BadRequestException("You cannot disable your own account");
        }
        if (user.getRole() == ERole.ROLE_ADMIN && !request.getEnabled()) {
            requireAnotherAdminExists(user.getId(), "disable the last remaining admin");
        }

        user.setEnabled(request.getEnabled());
        return UserResponse.from(userRepository.save(user));
    }

    @DeleteMapping("/users/{id}")
    @Transactional
    @Operation(summary = "Hard-delete a user; refuses when history would be orphaned")
    public MessageResponse deleteUser(@PathVariable Long id,
                                      @AuthenticationPrincipal UserDetailsImpl principal) {
        User user = loadUser(id);

        if (user.getId().equals(principal.getId())) {
            throw new BadRequestException("You cannot delete your own account");
        }
        if (user.getRole() == ERole.ROLE_ADMIN) {
            requireAnotherAdminExists(user.getId(), "delete the last remaining admin");
        }

        // Orders and restaurants carry non-null FKs to the user; deleting would either fail at
        // the database or destroy history. Suspending is the correct action in those cases.
        if (orderRepository.countByUserId(id) > 0) {
            throw new ConflictException(
                    "This user has orders and cannot be deleted. Disable the account instead.");
        }
        if (!restaurantRepository.findByOwnerId(id).isEmpty()) {
            throw new ConflictException(
                    "This user owns a restaurant and cannot be deleted. Reassign or delete it first.");
        }

        cartRepository.findByUserId(id).ifPresent(cartRepository::delete);
        deliveryInfoRepository.findByUserId(id).ifPresent(deliveryInfoRepository::delete);
        addressRepository.deleteByUserId(id);
        userRepository.delete(user);

        return new MessageResponse("User deleted");
    }

    // ------------------------------------------------------------ restaurants

    @GetMapping("/restaurants")
    @Operation(summary = "Every restaurant, including unapproved ones")
    public List<RestaurantResponse> listRestaurants() {
        return restaurantRepository.findAll().stream()
                .map(RestaurantResponse::summary)
                .collect(Collectors.toList());
    }

    @PatchMapping("/restaurants/{id}/approved")
    @Operation(summary = "Approve or unapprove a restaurant")
    public RestaurantResponse setApproved(@PathVariable Long id,
                                          @Valid @RequestBody ApprovedRequest request) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Restaurant", id));
        restaurant.setApproved(request.getApproved());
        return RestaurantResponse.summary(restaurantRepository.save(restaurant));
    }

    @DeleteMapping("/restaurants/{id}")
    @Transactional
    @Operation(summary = "Delete a restaurant and its menu; refuses when orders reference it")
    public MessageResponse deleteRestaurant(@PathVariable Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Restaurant", id));

        if (orderRepository.countByRestaurantId(id) > 0) {
            throw new ConflictException(
                    "This restaurant has orders and cannot be deleted. Unapprove it instead.");
        }

        // The menu cascades with the restaurant (CascadeType.ALL + orphanRemoval).
        restaurantRepository.delete(restaurant);
        return new MessageResponse("Restaurant deleted");
    }

    // ------------------------------------------------------- delivery partners

    @GetMapping("/delivery-partners")
    @Operation(summary = "Delivery accounts joined with their vehicle details")
    public List<DeliveryInfoResponse> listDeliveryPartners() {
        return userRepository.findByRole(ERole.ROLE_DELIVERY).stream()
                .map(user -> DeliveryInfoResponse.of(user,
                        deliveryInfoRepository.findByUserId(user.getId()).orElse(null)))
                .collect(Collectors.toList());
    }

    // ------------------------------------------------------------------ stats

    @GetMapping("/stats")
    @Operation(summary = "Real platform totals for the admin overview cards")
    public AdminStatsResponse stats() {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime endOfToday = LocalDate.now().atTime(LocalTime.MAX);

        List<Restaurant> restaurants = restaurantRepository.findAll();
        long approved = restaurants.stream()
                .filter(r -> Boolean.TRUE.equals(r.getApproved())).count();

        return new AdminStatsResponse(
                userRepository.count(),
                userRepository.countByRole(ERole.ROLE_CUSTOMER),
                restaurants.size(),
                approved,
                restaurants.size() - approved,
                userRepository.countByRole(ERole.ROLE_DELIVERY),
                orderRepository.countByCreatedAtBetween(startOfToday, endOfToday),
                orderRepository.sumRevenueBetween(startOfToday, endOfToday),
                orderRepository.count(),
                Math.round(restaurantRepository.averageRating() * 10.0) / 10.0);
    }

    // ---------------------------------------------------------------- helpers

    private User loadUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("User", id));
    }

    /** Applied only when a password is actually supplied — see AdminUserRequest.password. */
    private void requireValidPasswordLength(String password) {
        if (password.length() < 6 || password.length() > 40) {
            throw new BadRequestException("password must be between 6 and 40 characters");
        }
    }

    private ERole parseRole(String role, boolean allowNull) {
        if (role == null || role.isBlank()) {
            if (allowNull) {
                return null;
            }
            throw new BadRequestException("role is required");
        }
        try {
            return ERole.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Unknown role: " + role);
        }
    }

    /** Keeps at least one admin on the platform at all times. */
    private void requireAnotherAdminExists(Long excludingUserId, String action) {
        long admins = userRepository.findByRole(ERole.ROLE_ADMIN).stream()
                .filter(u -> !u.getId().equals(excludingUserId))
                .count();
        if (admins == 0) {
            throw new BadRequestException("You cannot " + action);
        }
    }
}
