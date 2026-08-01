package com.quickbite.food_delivery_backend.controllers;

import com.quickbite.food_delivery_backend.exception.BadRequestException;
import com.quickbite.food_delivery_backend.exception.ConflictException;
import com.quickbite.food_delivery_backend.exception.ResourceNotFoundException;
import com.quickbite.food_delivery_backend.models.DeliveryInfo;
import com.quickbite.food_delivery_backend.models.EOrderStatus;
import com.quickbite.food_delivery_backend.models.Order;
import com.quickbite.food_delivery_backend.models.User;
import com.quickbite.food_delivery_backend.payload.request.AvailabilityRequest;
import com.quickbite.food_delivery_backend.payload.request.DeliveryProfileRequest;
import com.quickbite.food_delivery_backend.payload.request.UpdateOrderStatusRequest;
import com.quickbite.food_delivery_backend.payload.response.DeliveryInfoResponse;
import com.quickbite.food_delivery_backend.payload.response.EarningsResponse;
import com.quickbite.food_delivery_backend.payload.response.OrderResponse;
import com.quickbite.food_delivery_backend.repository.DeliveryInfoRepository;
import com.quickbite.food_delivery_backend.repository.OrderRepository;
import com.quickbite.food_delivery_backend.repository.UserRepository;
import com.quickbite.food_delivery_backend.security.services.UserDetailsImpl;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** Everything a delivery partner does, scoped to the courier identified by the JWT. */
@RestController
@RequestMapping("/api/delivery")
@PreAuthorize("hasRole('DELIVERY')")
@Tag(name = "Delivery", description = "Courier job board, assignments, earnings and profile")
public class DeliveryController {

    /** The only transitions a courier may drive. Legality is still checked by EOrderStatus. */
    private static final Set<EOrderStatus> COURIER_TARGETS =
            EnumSet.of(EOrderStatus.PICKED_UP, EOrderStatus.OUT_FOR_DELIVERY, EOrderStatus.DELIVERED);

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final DeliveryInfoRepository deliveryInfoRepository;

    public DeliveryController(OrderRepository orderRepository,
                              UserRepository userRepository,
                              DeliveryInfoRepository deliveryInfoRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.deliveryInfoRepository = deliveryInfoRepository;
    }

    @GetMapping("/available")
    @Operation(summary = "Prepared orders that no courier has claimed yet")
    public List<OrderResponse> available() {
        return orderRepository
                .findByStatusAndDeliveryPartnerIsNullOrderByCreatedAtAsc(EOrderStatus.READY_FOR_PICKUP)
                .stream().map(OrderResponse::from).collect(Collectors.toList());
    }

    /**
     * Claims a job for this courier.
     *
     * <p>Two couriers tapping "accept" at the same instant both reach this method. The claim is
     * a single conditional UPDATE guarded by {@code delivery_partner_id is null}, so the
     * database decides the winner and the loser is told the job is gone — no read-then-write
     * window to lose.
     */
    @PostMapping("/orders/{orderId}/accept")
    @Transactional
    @Operation(summary = "Accept an available delivery job")
    public ResponseEntity<OrderResponse> accept(@PathVariable Long orderId,
                                                 @AuthenticationPrincipal UserDetailsImpl principal) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> ResourceNotFoundException.of("Order", orderId));

        if (order.getStatus() != EOrderStatus.READY_FOR_PICKUP) {
            throw new ConflictException("This order is not ready for pickup");
        }

        int claimed = orderRepository.claimForDelivery(orderId, principal.getId(),
                EOrderStatus.READY_FOR_PICKUP, LocalDateTime.now());
        if (claimed == 0) {
            throw new ConflictException("This order has already been accepted by another partner");
        }

        return ResponseEntity.ok(OrderResponse.from(reload(orderId)));
    }

    @GetMapping("/my-deliveries")
    @Operation(summary = "This courier's active and completed deliveries")
    public Map<String, List<OrderResponse>> myDeliveries(
            @AuthenticationPrincipal UserDetailsImpl principal) {

        List<Order> all = orderRepository.findByDeliveryPartnerIdOrderByCreatedAtDesc(principal.getId());

        Map<String, List<OrderResponse>> result = new LinkedHashMap<>();
        result.put("active", all.stream()
                .filter(o -> o.getStatus() != EOrderStatus.DELIVERED
                        && o.getStatus() != EOrderStatus.CANCELLED)
                .map(OrderResponse::from).collect(Collectors.toList()));
        result.put("completed", all.stream()
                .filter(o -> o.getStatus() == EOrderStatus.DELIVERED)
                .map(OrderResponse::from).collect(Collectors.toList()));
        return result;
    }

    @PatchMapping("/orders/{orderId}/status")
    @Transactional
    @Operation(summary = "Advance a delivery this courier is assigned to")
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request,
            @AuthenticationPrincipal UserDetailsImpl principal) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> ResourceNotFoundException.of("Order", orderId));

        Long assignedId = order.getDeliveryPartner() != null
                ? order.getDeliveryPartner().getId() : null;
        if (assignedId == null || !assignedId.equals(principal.getId())) {
            throw new AccessDeniedException("You are not the delivery partner for this order");
        }

        EOrderStatus target = request.getStatus();
        if (!COURIER_TARGETS.contains(target)) {
            throw new AccessDeniedException("Delivery partners cannot set status " + target);
        }
        if (!order.getStatus().canTransitionTo(target)) {
            throw new BadRequestException(
                    "Cannot change order status from " + order.getStatus() + " to " + target);
        }

        order.setStatus(target);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        return ResponseEntity.ok(OrderResponse.from(reload(orderId)));
    }

    @GetMapping("/earnings")
    @Operation(summary = "Completed deliveries and delivery-fee earnings, today and this week")
    public EarningsResponse earnings(@AuthenticationPrincipal UserDetailsImpl principal) {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime startOfWeek = LocalDate.now()
                .with(DayOfWeek.MONDAY).atStartOfDay();
        LocalDateTime now = LocalDateTime.now().with(LocalTime.MAX);

        Long id = principal.getId();
        return new EarningsResponse(
                orderRepository.countDeliveredBetween(id, startOfToday, now),
                orderRepository.sumDeliveryFeesBetween(id, startOfToday, now),
                orderRepository.countDeliveredBetween(id, startOfWeek, now),
                orderRepository.sumDeliveryFeesBetween(id, startOfWeek, now));
    }

    @GetMapping("/profile")
    @Operation(summary = "This courier's vehicle and zone details")
    public ResponseEntity<DeliveryInfoResponse> getProfile(
            @AuthenticationPrincipal UserDetailsImpl principal) {

        User user = loadUser(principal.getId());
        DeliveryInfo info = deliveryInfoRepository.findByUserId(principal.getId()).orElse(null);
        return ResponseEntity.ok(DeliveryInfoResponse.of(user, info));
    }

    @PutMapping("/profile")
    @Transactional
    @Operation(summary = "Create or update this courier's vehicle and zone details")
    public ResponseEntity<DeliveryInfoResponse> updateProfile(
            @Valid @RequestBody DeliveryProfileRequest request,
            @AuthenticationPrincipal UserDetailsImpl principal) {

        User user = loadUser(principal.getId());
        // Couriers who signed up before this data was captured have no row yet.
        DeliveryInfo info = deliveryInfoRepository.findByUserId(principal.getId())
                .orElseGet(DeliveryInfo::new);

        info.setUser(user);
        info.setVehicleType(request.getVehicleType());
        info.setVehicleModel(request.getVehicleModel());
        info.setLicenseNumber(request.getLicenseNumber());
        info.setVehicleRegistrationNumber(request.getVehicleRegistrationNumber());
        info.setDeliveryZone(request.getDeliveryZone());
        info.setIdProofUrl(request.getIdProofUrl());
        if (request.getAvailable() != null) {
            info.setAvailable(request.getAvailable());
        }

        return ResponseEntity.ok(
                DeliveryInfoResponse.of(user, deliveryInfoRepository.save(info)));
    }

    /**
     * The online/offline switch on its own.
     *
     * <p>Separate from PUT /profile because that endpoint requires the full set of vehicle
     * details, and a courier who has not filled those in yet must still be able to go offline.
     */
    @PatchMapping("/availability")
    @Transactional
    @Operation(summary = "Go online or offline for new delivery jobs")
    public ResponseEntity<DeliveryInfoResponse> setAvailability(
            @Valid @RequestBody AvailabilityRequest request,
            @AuthenticationPrincipal UserDetailsImpl principal) {

        User user = loadUser(principal.getId());
        DeliveryInfo info = deliveryInfoRepository.findByUserId(principal.getId())
                .orElseGet(() -> {
                    DeliveryInfo fresh = new DeliveryInfo();
                    fresh.setUser(user);
                    return fresh;
                });

        info.setAvailable(request.getAvailable());
        return ResponseEntity.ok(
                DeliveryInfoResponse.of(user, deliveryInfoRepository.save(info)));
    }

    private User loadUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("User", id));
    }

    /** Re-reads through the fetch graph so the response has items, customer and restaurant. */
    private Order reload(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> ResourceNotFoundException.of("Order", orderId));
    }
}
