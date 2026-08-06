package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.PasswordResetToken;
import com.dts.dersliktakip.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByToken(String token);

    @Modifying
    @Query("update PasswordResetToken token set token.used = true where token.user = :user and token.used = false")
    void markUnusedTokensAsUsed(@Param("user") User user);
}
