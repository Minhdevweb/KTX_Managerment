
package com.ktx.ktx.repository;

import com.ktx.ktx.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByFeeIdOrderByPaidAtDesc(Long feeId);

    List<Payment> findAllByOrderByPaidAtDesc();
}
