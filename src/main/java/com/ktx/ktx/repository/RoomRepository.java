package com.ktx.ktx.repository;

import com.ktx.ktx.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
//lấy tất cả phòng của tòa A,..
public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findByBuildingId(Long buildingId);

    List<Room> findByStatus(String status);

    boolean existsByBuildingIdAndRoomNumber(
            Long buildingId,
            String roomNumber
    );
}