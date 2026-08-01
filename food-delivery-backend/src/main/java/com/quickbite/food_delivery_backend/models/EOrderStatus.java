package com.quickbite.food_delivery_backend.models;

import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Order lifecycle:
 *
 * <pre>
 * PENDING -&gt; CONFIRMED -&gt; PREPARING -&gt; READY_FOR_PICKUP -&gt; PICKED_UP -&gt; OUT_FOR_DELIVERY -&gt; DELIVERED
 * </pre>
 *
 * with CANCELLED reachable until a courier has the food in hand.
 *
 * <p>The legal transitions live here and only here. The restaurant-facing endpoint and the
 * delivery endpoint both validate against {@link #canTransitionTo}, so the rules cannot drift
 * apart.
 */
public enum EOrderStatus {
    PENDING,
    CONFIRMED,
    PREPARING,
    READY_FOR_PICKUP,
    PICKED_UP,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED;

    private static final Map<EOrderStatus, Set<EOrderStatus>> TRANSITIONS =
            new EnumMap<>(EOrderStatus.class);

    static {
        TRANSITIONS.put(PENDING, EnumSet.of(CONFIRMED, CANCELLED));
        TRANSITIONS.put(CONFIRMED, EnumSet.of(PREPARING, CANCELLED));
        TRANSITIONS.put(PREPARING, EnumSet.of(READY_FOR_PICKUP, CANCELLED));
        TRANSITIONS.put(READY_FOR_PICKUP, EnumSet.of(PICKED_UP, CANCELLED));
        TRANSITIONS.put(PICKED_UP, EnumSet.of(OUT_FOR_DELIVERY));
        TRANSITIONS.put(OUT_FOR_DELIVERY, EnumSet.of(DELIVERED));
        TRANSITIONS.put(DELIVERED, EnumSet.noneOf(EOrderStatus.class));
        TRANSITIONS.put(CANCELLED, EnumSet.noneOf(EOrderStatus.class));
    }

    /** States this order may legally move to next. */
    public Set<EOrderStatus> nextStates() {
        return Collections.unmodifiableSet(
                TRANSITIONS.getOrDefault(this, EnumSet.noneOf(EOrderStatus.class)));
    }

    public boolean canTransitionTo(EOrderStatus target) {
        return target != null && nextStates().contains(target);
    }

    /** No further movement is possible from a terminal state. */
    public boolean isTerminal() {
        return nextStates().isEmpty();
    }

    /** True once the order has left the restaurant and is a courier's responsibility. */
    public boolean isInDeliveryPhase() {
        return this == PICKED_UP || this == OUT_FOR_DELIVERY || this == DELIVERED;
    }
}
