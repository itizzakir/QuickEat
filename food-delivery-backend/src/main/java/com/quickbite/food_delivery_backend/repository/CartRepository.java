package com.quickbite.food_delivery_backend.repository;

import com.quickbite.food_delivery_backend.models.Cart;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {

    // Every association the response serialises has to be listed here. Spring Data applies an
    // EntityGraph as a FETCH graph, which demotes anything NOT named to LAZY — so omitting
    // "user" would make the EAGER @OneToOne a proxy and break serialisation after the
    // session closes (spring.jpa.open-in-view=false).
    @EntityGraph(attributePaths = { "user", "items", "items.menuItem" })
    Optional<Cart> findByUserId(Long userId);
}
