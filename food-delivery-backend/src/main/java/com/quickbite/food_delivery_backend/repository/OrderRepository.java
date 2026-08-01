package com.quickbite.food_delivery_backend.repository;

import com.quickbite.food_delivery_backend.models.EOrderStatus;
import com.quickbite.food_delivery_backend.models.Order;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // "user" and "restaurant" are EAGER by mapping but must still be named: Spring Data
    // applies an EntityGraph as a FETCH graph, which demotes every unlisted attribute to
    // LAZY. Leaving them out makes them proxies that fail to serialise once the session
    // closes (spring.jpa.open-in-view=false).
    @EntityGraph(attributePaths = { "user", "restaurant", "deliveryPartner", "items", "items.menuItem" })
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = { "user", "restaurant", "deliveryPartner", "items", "items.menuItem" })
    List<Order> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);

    @EntityGraph(attributePaths = { "user", "restaurant", "deliveryPartner", "items", "items.menuItem" })
    List<Order> findByDeliveryPartnerIdOrderByCreatedAtDesc(Long deliveryPartnerId);

    /**
     * Paged restaurant order feed. Deliberately does NOT join-fetch the item collection:
     * combining a collection fetch with a Pageable forces Hibernate to paginate in memory.
     * Callers run inside a read-only transaction and let the batch fetcher load items.
     */
    Page<Order> findByRestaurantId(Long restaurantId, Pageable pageable);

    Page<Order> findByDeliveryPartnerId(Long deliveryPartnerId, Pageable pageable);

    /** The job board: prepared orders nobody has claimed yet. */
    @EntityGraph(attributePaths = { "user", "restaurant", "deliveryPartner", "items", "items.menuItem" })
    List<Order> findByStatusAndDeliveryPartnerIsNullOrderByCreatedAtAsc(EOrderStatus status);

    /**
     * Claims an order for a courier, atomically.
     *
     * <p>The {@code delivery_partner_id is null} predicate is the concurrency guard: two
     * couriers accepting the same order at the same moment both issue this UPDATE, and the
     * database serialises them so exactly one reports a row updated. The loser gets 0 and is
     * told the order is already taken.
     *
     * @return number of rows updated — 1 on success, 0 if someone else won the race
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Order o set o.deliveryPartner.id = :partnerId, o.updatedAt = :now "
            + "where o.id = :orderId and o.deliveryPartner is null and o.status = :expectedStatus")
    int claimForDelivery(@Param("orderId") Long orderId,
                         @Param("partnerId") Long partnerId,
                         @Param("expectedStatus") EOrderStatus expectedStatus,
                         @Param("now") LocalDateTime now);

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    @Query("select coalesce(sum(o.totalAmount), 0) from Order o "
            + "where o.createdAt between :from and :to and o.status <> com.quickbite.food_delivery_backend.models.EOrderStatus.CANCELLED")
    double sumRevenueBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("select count(o) from Order o where o.deliveryPartner.id = :partnerId "
            + "and o.status = com.quickbite.food_delivery_backend.models.EOrderStatus.DELIVERED "
            + "and o.createdAt between :from and :to")
    long countDeliveredBetween(@Param("partnerId") Long partnerId,
                               @Param("from") LocalDateTime from,
                               @Param("to") LocalDateTime to);

    @Query("select coalesce(sum(coalesce(o.deliveryFee, 0)), 0) from Order o "
            + "where o.deliveryPartner.id = :partnerId "
            + "and o.status = com.quickbite.food_delivery_backend.models.EOrderStatus.DELIVERED "
            + "and o.createdAt between :from and :to")
    double sumDeliveryFeesBetween(@Param("partnerId") Long partnerId,
                                  @Param("from") LocalDateTime from,
                                  @Param("to") LocalDateTime to);

    long countByUserId(Long userId);

    long countByRestaurantId(Long restaurantId);
}
