package com.quickbite.food_delivery_backend.repository;

import com.quickbite.food_delivery_backend.models.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    List<Restaurant> findByCategoryContainingIgnoreCase(String category);
}
