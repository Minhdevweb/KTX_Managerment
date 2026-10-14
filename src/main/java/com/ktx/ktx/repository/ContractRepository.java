
package com.ktx.ktx.repository;

import com.ktx.ktx.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContractRepository
        extends JpaRepository<Contract, Long> {

    List<Contract> findAllByOrderByCreatedAtDesc();

    Optional<Contract> findByRegistrationId(Long registrationId);

    List<Contract> findByRegistrationStudentIdOrderByCreatedAtDesc(
            Long studentId
    );

    boolean existsByRegistrationId(Long registrationId);

    boolean existsByContractNumber(String contractNumber);
}
