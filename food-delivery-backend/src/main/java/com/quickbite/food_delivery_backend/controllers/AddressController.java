package com.quickbite.food_delivery_backend.controllers;

import com.quickbite.food_delivery_backend.exception.ResourceNotFoundException;
import com.quickbite.food_delivery_backend.models.Address;
import com.quickbite.food_delivery_backend.models.User;
import com.quickbite.food_delivery_backend.payload.request.AddressRequest;
import com.quickbite.food_delivery_backend.payload.response.AddressResponse;
import com.quickbite.food_delivery_backend.payload.response.MessageResponse;
import com.quickbite.food_delivery_backend.repository.AddressRepository;
import com.quickbite.food_delivery_backend.repository.UserRepository;
import com.quickbite.food_delivery_backend.security.services.UserDetailsImpl;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * The signed-in user's address book.
 *
 * <p>Scoped to "me" by design — there is no user id in any path, so there is no id to tamper
 * with. Every lookup is by (addressId, principal.id), which makes another user's address
 * indistinguishable from one that does not exist.
 */
@RestController
@RequestMapping("/api/users/me/addresses")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Addresses", description = "Saved delivery addresses for the signed-in user")
public class AddressController {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressController(AddressRepository addressRepository, UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    @Operation(summary = "List saved addresses, default first")
    public List<AddressResponse> list(@AuthenticationPrincipal UserDetailsImpl principal) {
        return addressRepository.findByUserIdOrderByIsDefaultDescIdAsc(principal.getId())
                .stream().map(AddressResponse::from).collect(Collectors.toList());
    }

    @PostMapping
    @Transactional
    @Operation(summary = "Save a new address")
    public ResponseEntity<AddressResponse> create(@Valid @RequestBody AddressRequest request,
                                                   @AuthenticationPrincipal UserDetailsImpl principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> ResourceNotFoundException.of("User", principal.getId()));

        Address address = new Address();
        address.setUser(user);
        apply(request, address);

        // The first address a user saves is their default whether they asked or not.
        boolean first = addressRepository.countByUserId(principal.getId()) == 0;
        address.setIsDefault(first || Boolean.TRUE.equals(request.getIsDefault()));

        Address saved = addressRepository.save(address);
        if (saved.isDefaultAddress()) {
            addressRepository.clearDefaultExcept(principal.getId(), saved.getId());
        }
        syncUserAddress(user, saved);

        return ResponseEntity.status(HttpStatus.CREATED).body(AddressResponse.from(saved));
    }

    @PutMapping("/{id}")
    @Transactional
    @Operation(summary = "Edit a saved address")
    public AddressResponse update(@PathVariable Long id,
                                  @Valid @RequestBody AddressRequest request,
                                  @AuthenticationPrincipal UserDetailsImpl principal) {
        Address address = load(id, principal);
        apply(request, address);

        if (Boolean.TRUE.equals(request.getIsDefault())) {
            address.setIsDefault(true);
        }
        Address saved = addressRepository.save(address);
        if (saved.isDefaultAddress()) {
            addressRepository.clearDefaultExcept(principal.getId(), saved.getId());
            syncUserAddress(saved.getUser(), saved);
        }
        return AddressResponse.from(saved);
    }

    @PatchMapping("/{id}/default")
    @Transactional
    @Operation(summary = "Make this the default delivery address")
    public AddressResponse makeDefault(@PathVariable Long id,
                                       @AuthenticationPrincipal UserDetailsImpl principal) {
        Address address = load(id, principal);
        address.setIsDefault(true);
        Address saved = addressRepository.save(address);
        addressRepository.clearDefaultExcept(principal.getId(), saved.getId());
        syncUserAddress(saved.getUser(), saved);
        return AddressResponse.from(saved);
    }

    @DeleteMapping("/{id}")
    @Transactional
    @Operation(summary = "Delete a saved address")
    public MessageResponse delete(@PathVariable Long id,
                                  @AuthenticationPrincipal UserDetailsImpl principal) {
        Address address = load(id, principal);
        boolean wasDefault = address.isDefaultAddress();
        addressRepository.delete(address);

        // Promote another address so the user is never left without a default.
        if (wasDefault) {
            addressRepository.findByUserIdOrderByIsDefaultDescIdAsc(principal.getId())
                    .stream().findFirst().ifPresent(next -> {
                        next.setIsDefault(true);
                        addressRepository.save(next);
                        syncUserAddress(next.getUser(), next);
                    });
        }
        return new MessageResponse("Address deleted");
    }

    private Address load(Long id, UserDetailsImpl principal) {
        return addressRepository.findByIdAndUserId(id, principal.getId())
                .orElseThrow(() -> ResourceNotFoundException.of("Address", id));
    }

    private void apply(AddressRequest request, Address address) {
        address.setLabel(request.getLabel());
        address.setLine1(request.getLine1());
        address.setLine2(request.getLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPostalCode(request.getPostalCode());
        address.setCountry(request.getCountry());
    }

    /**
     * Keeps the legacy User.address string in step with the default address, so anything still
     * reading that single field (older order rows, the profile header) stays coherent.
     */
    private void syncUserAddress(User user, Address address) {
        if (user == null || address == null) return;
        user.setAddress(address.toFormattedString());
        userRepository.save(user);
    }
}
