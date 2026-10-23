
package com.ktx.ktx.repository;

import com.ktx.ktx.entity.Fee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface FeeRepository extends JpaRepository<Fee, Long> {

    List<Fee> findAllByOrderByBillingMonthDesc();

    List<Fee> findByContractRegistrationStudentIdOrderByBillingMonthDesc(
            Long studentId
    );

    boolean existsByContractIdAndBillingMonth(
            Long contractId,
            LocalDate billingMonth
    );
}
