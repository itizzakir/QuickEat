package com.quickbite.food_delivery_backend.payload.response;

import com.quickbite.food_delivery_backend.models.Cart;
import com.quickbite.food_delivery_backend.models.CartItem;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/** Cart view. Carries only the owning user's id — never the User entity. */
public class CartResponse {

    private final Long id;
    private final Long userId;
    private final List<Item> items;
    private final Double totalPrice;

    private CartResponse(Cart cart) {
        this.id = cart.getId();
        this.userId = cart.getUser() != null ? cart.getUser().getId() : null;
        this.items = cart.getItems().stream().map(Item::new).collect(Collectors.toList());
        this.totalPrice = cart.getTotalPrice();
    }

    private CartResponse() {
        this.id = null;
        this.userId = null;
        this.items = Collections.emptyList();
        this.totalPrice = 0.0;
    }

    public static CartResponse from(Cart cart) {
        return cart == null ? empty() : new CartResponse(cart);
    }

    /** Shape returned when a customer has no cart row yet. */
    public static CartResponse empty() {
        return new CartResponse();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public List<Item> getItems() { return items; }
    public Double getTotalPrice() { return totalPrice; }

    public static class Item {
        private final Long id;
        private final MenuItemResponse menuItem;
        private final Integer quantity;

        private Item(CartItem cartItem) {
            this.id = cartItem.getId();
            this.menuItem = MenuItemResponse.from(cartItem.getMenuItem());
            this.quantity = cartItem.getQuantity();
        }

        public Long getId() { return id; }
        public MenuItemResponse getMenuItem() { return menuItem; }
        public Integer getQuantity() { return quantity; }
    }
}
