package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.Role;
import com.dts.dersliktakip.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    long countByRole(Role role);

    List<User> findTop5ByOrderByCreatedAtDesc();
}

