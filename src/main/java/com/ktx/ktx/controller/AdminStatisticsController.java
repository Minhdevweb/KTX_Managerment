
package com.ktx.ktx.controller;

import com.ktx.ktx.entity.User;
import com.ktx.ktx.repository.UserRepository;
import com.ktx.ktx.repository.BuildingRepository;
import com.ktx.ktx.repository.RoomRepository;
import com.ktx.ktx.repository.BedRepository;
import com.ktx.ktx.repository.RegistrationRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/statistics")
public class AdminStatisticsController {

    private final UserRepository userRepository;
    private final BuildingRepository buildingRepository;
    private final RoomRepository roomRepository;
    private final BedRepository bedRepository;
    private final RegistrationRepository registrationRepository;

    public AdminStatisticsController(
            UserRepository userRepository,
            BuildingRepository buildingRepository,
            RoomRepository roomRepository,
            BedRepository bedRepository,
            RegistrationRepository registrationRepository) {

        this.userRepository = userRepository;
        this.buildingRepository = buildingRepository;
        this.roomRepository = roomRepository;
        this.bedRepository = bedRepository;
        this.registrationRepository = registrationRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getStatistics() {

        Map<String, Object> statistics = new LinkedHashMap<>();

        // Thống kê sinh viên
        long totalStudents = userRepository.findAll()
                .stream()
                .filter(user -> user.getRole() != null
                        && "STUDENT".equalsIgnoreCase(
                        user.getRole().getName()))
                .count();

        statistics.put("totalStudents", totalStudents);

        // Thống kê cơ sở vật chất
        statistics.put("totalBuildings", buildingRepository.count());
        statistics.put("totalRooms", roomRepository.count());
        statistics.put("totalBeds", bedRepository.count());

        // Thống kê trạng thái giường
        long availableBeds =
                bedRepository.findByStatus("AVAILABLE").size();

        long occupiedBeds =
                bedRepository.findByStatus("OCCUPIED").size();

        long maintenanceBeds =
                bedRepository.findByStatus("MAINTENANCE").size();

        statistics.put("availableBeds", availableBeds);
        statistics.put("occupiedBeds", occupiedBeds);
        statistics.put("maintenanceBeds", maintenanceBeds);

        // Tỷ lệ lấp đầy giường
        long totalBeds = bedRepository.count();

        double occupancyRate = totalBeds == 0
                ? 0.0
                : Math.round(
                occupiedBeds * 10000.0 / totalBeds
        ) / 100.0;

        statistics.put("occupancyRate", occupancyRate);

        // Thống kê trạng thái phòng
        statistics.put(
                "availableRooms",
                roomRepository.findByStatus("AVAILABLE").size());

        statistics.put(
                "fullRooms",
                roomRepository.findByStatus("FULL").size());

        statistics.put(
                "maintenanceRooms",
                roomRepository.findByStatus("MAINTENANCE").size());

        // Thống kê đăng ký KTX
        statistics.put(
                "totalRegistrations",
                registrationRepository.count());

        statistics.put(
                "pendingRegistrations",
                registrationRepository
                        .findByStatusOrderByCreatedAtDesc("PENDING")
                        .size());

        statistics.put(
                "approvedRegistrations",
                registrationRepository
                        .findByStatusOrderByCreatedAtDesc("APPROVED")
                        .size());

        statistics.put(
                "rejectedRegistrations",
                registrationRepository
                        .findByStatusOrderByCreatedAtDesc("REJECTED")
                        .size());

        return ResponseEntity.ok(statistics);
    }
}
