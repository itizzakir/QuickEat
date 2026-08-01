package com.quickbite.food_delivery_backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.quickbite.food_delivery_backend.models.ERole;
import com.quickbite.food_delivery_backend.models.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByEmail(String email);

  Boolean existsByEmail(String email);

  long countByRole(ERole role);

  List<User> findByRole(ERole role);

  /** Admin directory search. Both filters are optional; null means "no filter". */
  @Query("select u from User u "
          + "where (:role is null or u.role = :role) "
          + "and (:search is null or lower(u.fullName) like lower(concat('%', :search, '%')) "
          + "     or lower(u.email) like lower(concat('%', :search, '%')))")
  Page<User> search(@Param("role") ERole role, @Param("search") String search, Pageable pageable);
}
