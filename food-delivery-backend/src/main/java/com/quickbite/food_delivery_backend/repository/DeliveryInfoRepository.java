package com.quickbite.food_delivery_backend.repository;

import com.quickbite.food_delivery_backend.models.DeliveryInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryInfoRepository extends JpaRepository<DeliveryInfo, Long> {
    Optional<DeliveryInfo> findByUserId(Long userId);
}
