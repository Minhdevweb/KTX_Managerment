package com.ktx.ktx.repository;

import com.ktx.ktx.entity.Registration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Collection;

public interface RegistrationRepository
        extends JpaRepository<Registration, Long> {

    List<Registration> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    List<Registration> findAllByOrderByCreatedAtDesc();

    List<Registration> findByStatusOrderByCreatedAtDesc(String status);

    boolean existsByStudentIdAndStatusIn(
            Long studentId,
            Collection<String> statuses
    );

    boolean existsByBedIdAndStatusIn(
            Long bedId,
            Collection<String> statuses
    );
}