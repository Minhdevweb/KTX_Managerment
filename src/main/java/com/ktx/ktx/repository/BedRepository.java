package com.ktx.ktx.repository;

import com.ktx.ktx.entity.Bed;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BedRepository extends JpaRepository<Bed, Long> {

    List<Bed> findByRoomId(Long roomId);

    List<Bed> findByStatus(String status);

    List<Bed> findByRoomIdAndStatus(
            Long roomId,
            String status
    );

    boolean existsByRoomIdAndBedNumber(
            Long roomId,
            String bedNumber
    );
}