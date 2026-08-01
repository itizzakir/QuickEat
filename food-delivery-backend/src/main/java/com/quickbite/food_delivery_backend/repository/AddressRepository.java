package com.quickbite.food_delivery_backend.repository;

import com.quickbite.food_delivery_backend.models.Address;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {

    List<Address> findByUserIdOrderByIsDefaultDescIdAsc(Long userId);

    Optional<Address> findByIdAndUserId(Long id, Long userId);

    long countByUserId(Long userId);

    /** Clears the flag on every other row so "default" stays singular. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Address a set a.isDefault = false where a.user.id = :userId and a.id <> :keepId")
    void clearDefaultExcept(@Param("userId") Long userId, @Param("keepId") Long keepId);

    void deleteByUserId(Long userId);
}
