package com.ktx.ktx.controller;

import com.ktx.ktx.entity.Bed;
import com.ktx.ktx.entity.Registration;
import com.ktx.ktx.entity.Room;
import com.ktx.ktx.repository.BedRepository;
import com.ktx.ktx.repository.RegistrationRepository;
import com.ktx.ktx.repository.RoomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin/registrations")
public class AdminRegistrationController {

    private final RegistrationRepository registrationRepository;
    private final BedRepository bedRepository;
    private final RoomRepository roomRepository;

    public AdminRegistrationController(
            RegistrationRepository registrationRepository,
            BedRepository bedRepository,
            RoomRepository roomRepository
    ) {
        this.registrationRepository = registrationRepository;
        this.bedRepository = bedRepository;
        this.roomRepository = roomRepository;
    }

    // ==========================================
    // LẤY TẤT CẢ ĐƠN ĐĂNG KÝ
    // ==========================================

    @GetMapping
    public ResponseEntity<?> getAllRegistrations() {

        List<Registration> registrations =
                registrationRepository.findAllByOrderByCreatedAtDesc();

        List<Map<String, Object>> result = new ArrayList<>();

        for (Registration registration : registrations) {

            Map<String, Object> data = new LinkedHashMap<>();

            data.put("id", registration.getId());
            data.put("status", registration.getStatus());
            data.put("createdAt", registration.getCreatedAt());

            // =========================
            // SINH VIÊN
            // =========================

            if (registration.getStudent() != null) {

                data.put(
                        "studentId",
                        registration.getStudent().getId()
                );

                data.put(
                        "username",
                        registration.getStudent().getUsername()
                );

                data.put(
                        "fullName",
                        registration.getStudent().getFullName()
                );

                data.put(
                        "email",
                        registration.getStudent().getEmail()
                );

                data.put(
                        "phone",
                        registration.getStudent().getPhone()
                );
            }

            // =========================
            // PHÒNG
            // =========================

            if (registration.getRoom() != null) {

                data.put(
                        "roomId",
                        registration.getRoom().getId()
                );

                data.put(
                        "roomNumber",
                        registration.getRoom().getRoomNumber()
                );

                data.put(
                        "roomStatus",
                        registration.getRoom().getStatus()
                );

                if (registration.getRoom().getBuilding() != null) {

                    data.put(
                            "buildingCode",
                            registration.getRoom()
                                    .getBuilding()
                                    .getCode()
                    );

                    data.put(
                            "buildingName",
                            registration.getRoom()
                                    .getBuilding()
                                    .getName()
                    );
                }
            }

            // =========================
            // GIƯỜNG
            // =========================

            if (registration.getBed() != null) {

                data.put(
                        "bedId",
                        registration.getBed().getId()
                );

                data.put(
                        "bedNumber",
                        registration.getBed().getBedNumber()
                );

                data.put(
                        "bedStatus",
                        registration.getBed().getStatus()
                );
            }

            result.add(data);
        }

        return ResponseEntity.ok(result);
    }


    // ==========================================
    // LẤY CÁC ĐƠN ĐANG CHỜ DUYỆT
    // ==========================================

    @GetMapping("/pending")
    public ResponseEntity<?> getPendingRegistrations() {

        List<Registration> registrations =
                registrationRepository
                        .findByStatusOrderByCreatedAtDesc("PENDING");

        List<Map<String, Object>> result = new ArrayList<>();

        for (Registration registration : registrations) {

            Map<String, Object> data = new LinkedHashMap<>();

            data.put("id", registration.getId());
            data.put("status", registration.getStatus());
            data.put("createdAt", registration.getCreatedAt());

            if (registration.getStudent() != null) {

                data.put(
                        "studentId",
                        registration.getStudent().getId()
                );

                data.put(
                        "username",
                        registration.getStudent().getUsername()
                );

                data.put(
                        "fullName",
                        registration.getStudent().getFullName()
                );

                data.put(
                        "email",
                        registration.getStudent().getEmail()
                );

                data.put(
                        "phone",
                        registration.getStudent().getPhone()
                );
            }

            if (registration.getRoom() != null) {

                data.put(
                        "roomId",
                        registration.getRoom().getId()
                );

                data.put(
                        "roomNumber",
                        registration.getRoom().getRoomNumber()
                );

                if (registration.getRoom().getBuilding() != null) {

                    data.put(
                            "buildingCode",
                            registration.getRoom()
                                    .getBuilding()
                                    .getCode()
                    );

                    data.put(
                            "buildingName",
                            registration.getRoom()
                                    .getBuilding()
                                    .getName()
                    );
                }
            }

            if (registration.getBed() != null) {

                data.put(
                        "bedId",
                        registration.getBed().getId()
                );

                data.put(
                        "bedNumber",
                        registration.getBed().getBedNumber()
                );

                data.put(
                        "bedStatus",
                        registration.getBed().getStatus()
                );
            }

            result.add(data);
        }

        return ResponseEntity.ok(result);
    }


    // ==========================================
    // DUYỆT ĐƠN
    // ==========================================

    @PutMapping("/{id}/approve")
    @Transactional
    public ResponseEntity<?> approveRegistration(
            @PathVariable Long id
    ) {

        Optional<Registration> optionalRegistration =
                registrationRepository.findById(id);

        if (optionalRegistration.isEmpty()) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy đơn đăng ký!");
        }

        Registration registration =
                optionalRegistration.get();

        // Chỉ được duyệt đơn PENDING
        if (!"PENDING".equalsIgnoreCase(
                registration.getStatus()
        )) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(
                            "Đơn này đã được xử lý trước đó!"
                    );
        }

        Bed bed = registration.getBed();

        Room room = registration.getRoom();

        if (bed == null) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("Đơn đăng ký không có giường!");
        }

        if (room == null) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("Đơn đăng ký không có phòng!");
        }

        // Kiểm tra giường còn trống
        if (!"AVAILABLE".equalsIgnoreCase(
                bed.getStatus()
        )) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(
                            "Giường này không còn trống, không thể duyệt!"
                    );
        }

        // ==========================================
        // DUYỆT
        // ==========================================

        registration.setStatus("APPROVED");

        // Giường chuyển sang đang sử dụng
        bed.setStatus("OCCUPIED");

        bedRepository.save(bed);

        // ==========================================
        // KIỂM TRA PHÒNG CÒN GIƯỜNG TRỐNG KHÔNG
        // ==========================================

        List<Bed> availableBeds =
                bedRepository.findByRoomIdAndStatus(
                        room.getId(),
                        "AVAILABLE"
                );

        if (availableBeds.isEmpty()) {

            room.setStatus("FULL");

        } else {

            room.setStatus("AVAILABLE");
        }

        roomRepository.save(room);

        Registration saved =
                registrationRepository.save(registration);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Duyệt đăng ký KTX thành công!",
                        "registrationId",
                        saved.getId(),
                        "status",
                        saved.getStatus()
                )
        );
    }


    // ==========================================
    // TỪ CHỐI ĐƠN
    // ==========================================

    @PutMapping("/{id}/reject")
    @Transactional
    public ResponseEntity<?> rejectRegistration(
            @PathVariable Long id
    ) {

        Optional<Registration> optionalRegistration =
                registrationRepository.findById(id);

        if (optionalRegistration.isEmpty()) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy đơn đăng ký!");
        }

        Registration registration =
                optionalRegistration.get();

        // Chỉ được từ chối đơn PENDING
        if (!"PENDING".equalsIgnoreCase(
                registration.getStatus()
        )) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(
                            "Đơn này đã được xử lý trước đó!"
                    );
        }

        registration.setStatus("REJECTED");

        registrationRepository.save(registration);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Đã từ chối đơn đăng ký!",
                        "registrationId",
                        registration.getId(),
                        "status",
                        registration.getStatus()
                )
        );
    }


    // ==========================================
    // XEM CHI TIẾT ĐƠN
    // ==========================================

    @GetMapping("/{id}")
    public ResponseEntity<?> getRegistrationById(
            @PathVariable Long id
    ) {

        Optional<Registration> optionalRegistration =
                registrationRepository.findById(id);

        if (optionalRegistration.isEmpty()) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy đơn đăng ký!");
        }

        Registration registration =
                optionalRegistration.get();

        Map<String, Object> data =
                new LinkedHashMap<>();

        data.put("id", registration.getId());
        data.put("status", registration.getStatus());
        data.put("createdAt", registration.getCreatedAt());

        if (registration.getStudent() != null) {

            data.put(
                    "studentId",
                    registration.getStudent().getId()
            );

            data.put(
                    "username",
                    registration.getStudent().getUsername()
            );

            data.put(
                    "fullName",
                    registration.getStudent().getFullName()
            );

            data.put(
                    "email",
                    registration.getStudent().getEmail()
            );

            data.put(
                    "phone",
                    registration.getStudent().getPhone()
            );
        }

        if (registration.getRoom() != null) {

            data.put(
                    "roomId",
                    registration.getRoom().getId()
            );

            data.put(
                    "roomNumber",
                    registration.getRoom().getRoomNumber()
            );

            data.put(
                    "roomStatus",
                    registration.getRoom().getStatus()
            );

            if (registration.getRoom().getBuilding() != null) {

                data.put(
                        "buildingCode",
                        registration.getRoom()
                                .getBuilding()
                                .getCode()
                );

                data.put(
                        "buildingName",
                        registration.getRoom()
                                .getBuilding()
                                .getName()
                );
            }
        }

        if (registration.getBed() != null) {

            data.put(
                    "bedId",
                    registration.getBed().getId()
            );

            data.put(
                    "bedNumber",
                    registration.getBed().getBedNumber()
            );

            data.put(
                    "bedStatus",
                    registration.getBed().getStatus()
            );
        }

        return ResponseEntity.ok(data);
    }
}