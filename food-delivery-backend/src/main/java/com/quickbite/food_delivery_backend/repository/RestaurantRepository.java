package com.quickbite.food_delivery_backend.repository;

import com.quickbite.food_delivery_backend.models.Restaurant;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    // The list endpoints deliberately leave `menu` uninitialised: with 32 restaurants and
    // ~300 dishes, join-fetching it would put the entire catalogue in every listing response.
    // Hibernate6Module serialises the uninitialised collection as null (see JacksonConfig).
    // Only the detail endpoint fetches the menu.
    @Override
    @EntityGraph(attributePaths = { "menu" })
    Optional<Restaurant> findById(Long id);

    List<Restaurant> findByCategoryContainingIgnoreCase(String category);

    Optional<Restaurant> findByName(String name);

    /** One owner maps to one restaurant, but this returns a list so a broken pairing is visible. */
    List<Restaurant> findByOwnerId(Long ownerId);

    @EntityGraph(attributePaths = { "menu" })
    Optional<Restaurant> findWithMenuById(Long id);

    @Query("select coalesce(avg(r.rating), 0) from Restaurant r where r.rating is not null")
    double averageRating();
}
