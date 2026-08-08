package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    @Query("select count(u) from User u join u.roles r where r = :role")
    long countByRole(@Param("role") com.dts.dersliktakip.entity.Role role);

    @Query("select distinct u from User u join u.roles r where r = :role and u.active = true")
    List<User> findActiveUsersByRole(@Param("role") com.dts.dersliktakip.entity.Role role);

    List<User> findTop5ByOrderByCreatedAtDesc();
}

