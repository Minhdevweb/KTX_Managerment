package com.ktx.ktx.controller;

import com.ktx.ktx.entity.Bed;
import com.ktx.ktx.entity.Registration;
import com.ktx.ktx.entity.Room;
import com.ktx.ktx.entity.User;
import com.ktx.ktx.repository.BedRepository;
import com.ktx.ktx.repository.RegistrationRepository;
import com.ktx.ktx.repository.RoomRepository;
import com.ktx.ktx.repository.UserRepository;
import com.ktx.ktx.entity.Building;
import com.ktx.ktx.repository.BuildingRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/student/registrations")
public class StudentRegistrationController {

    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final BedRepository bedRepository;
    private final BuildingRepository buildingRepository;

    public StudentRegistrationController(
            RegistrationRepository registrationRepository,
            UserRepository userRepository,
            RoomRepository roomRepository,
            BedRepository bedRepository,
            BuildingRepository buildingRepository
    ) {
        this.registrationRepository = registrationRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.bedRepository = bedRepository;
        this.buildingRepository = buildingRepository;
    }

    // =========================
// XEM DANH SÁCH TÒA CÒN CHỖ
// =========================

    @GetMapping("/buildings")
    public ResponseEntity<?> getAvailableBuildings() {

        List<Building> buildings =
                buildingRepository.findAll();

        List<Map<String, Object>> result =
                new ArrayList<>();

        for (Building building : buildings) {

            List<Room> rooms =
                    roomRepository.findByBuildingId(
                            building.getId()
                    );

            boolean hasAvailableRoom = false;

            for (Room room : rooms) {

                // Chỉ cho sinh viên thấy phòng AVAILABLE
                if (!"AVAILABLE".equalsIgnoreCase(
                        room.getStatus()
                )) {
                    continue;
                }

                List<Bed> beds =
                        bedRepository.findByRoomIdAndStatus(
                                room.getId(),
                                "AVAILABLE"
                        );

                if (!beds.isEmpty()) {
                    hasAvailableRoom = true;
                    break;
                }
            }

            // Tòa không còn phòng có giường trống thì không hiển thị
            if (!hasAvailableRoom) {
                continue;
            }

            Map<String, Object> data =
                    new LinkedHashMap<>();

            data.put("id", building.getId());
            data.put("code", building.getCode());
            data.put("name", building.getName());
            data.put("description", building.getDescription());

            result.add(data);
        }

        return ResponseEntity.ok(result);
    }


// =========================
// XEM PHÒNG THEO TÒA
// =========================

    @GetMapping("/buildings/{buildingId}/rooms")
    public ResponseEntity<?> getAvailableRoomsByBuilding(
            @PathVariable Long buildingId
    ) {

        if (!buildingRepository.existsById(buildingId)) {

            return ResponseEntity.status(
                    HttpStatus.NOT_FOUND
            ).body("Không tìm thấy tòa nhà!");
        }

        List<Room> rooms =
                roomRepository.findByBuildingId(
                        buildingId
                );

        List<Map<String, Object>> result =
                new ArrayList<>();

        for (Room room : rooms) {

            // FULL hoặc MAINTENANCE đều không cho đăng ký
            if (!"AVAILABLE".equalsIgnoreCase(
                    room.getStatus()
            )) {
                continue;
            }

            List<Bed> beds =
                    bedRepository.findByRoomIdAndStatus(
                            room.getId(),
                            "AVAILABLE"
                    );

            if (beds.isEmpty()) {
                continue;
            }

            Map<String, Object> data =
                    new LinkedHashMap<>();

            data.put("id", room.getId());
            data.put("roomNumber", room.getRoomNumber());
            data.put("capacity", room.getCapacity());
            data.put("status", room.getStatus());
            data.put("availableBeds", beds.size());

            if (room.getBuilding() != null) {

                data.put(
                        "buildingId",
                        room.getBuilding().getId()
                );

                data.put(
                        "buildingCode",
                        room.getBuilding().getCode()
                );

                data.put(
                        "buildingName",
                        room.getBuilding().getName()
                );
            }

            result.add(data);
        }

        return ResponseEntity.ok(result);
    }

    // =========================
    // XEM GIƯỜNG CÒN TRỐNG
    // =========================

    @GetMapping("/rooms/{roomId}/beds")
    public ResponseEntity<?> getAvailableBeds(
            @PathVariable Long roomId
    ) {

        if (!roomRepository.existsById(roomId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy phòng!");
        }

        List<Bed> beds =
                bedRepository.findByRoomIdAndStatus(
                        roomId,
                        "AVAILABLE"
                );

        return ResponseEntity.ok(beds);
    }


    // =========================
    // ĐĂNG KÝ KTX
    // =========================

    @PostMapping
    public ResponseEntity<?> createRegistration(
            @RequestBody Map<String, Object> request,
            java.security.Principal principal
    ) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Bạn chưa đăng nhập!");
        }

        String username = principal.getName();

        Optional<User> optionalStudent =
                userRepository.findByUsername(username);

        if (optionalStudent.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy sinh viên!");
        }

        User student = optionalStudent.get();

        // Kiểm tra role STUDENT
        if (student.getRole() == null
                || !"STUDENT".equalsIgnoreCase(student.getRole().getName())) {

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Tài khoản không phải sinh viên!");
        }

        Object roomIdObject = request.get("roomId");
        Object bedIdObject = request.get("bedId");

        if (roomIdObject == null || bedIdObject == null) {
            return ResponseEntity.badRequest()
                    .body("Vui lòng chọn phòng và giường!");
        }

        Long roomId;
        Long bedId;

        try {
            roomId = Long.valueOf(roomIdObject.toString());
            bedId = Long.valueOf(bedIdObject.toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest()
                    .body("ID phòng hoặc giường không hợp lệ!");
        }

        // Không cho sinh viên đăng ký nhiều đơn đang hoạt động
        boolean alreadyRegistered =
                registrationRepository.existsByStudentIdAndStatusIn(
                        student.getId(),
                        List.of("PENDING", "APPROVED")
                );

        if (alreadyRegistered) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Bạn đã có đơn đăng ký KTX đang chờ duyệt hoặc đã được duyệt!");
        }

        Optional<Room> optionalRoom =
                roomRepository.findById(roomId);

        if (optionalRoom.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy phòng!");
        }

        Room room = optionalRoom.get();

        // Không cho đăng ký phòng bảo trì
        if ("MAINTENANCE".equalsIgnoreCase(room.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Phòng đang bảo trì, không thể đăng ký!");
        }

        Optional<Bed> optionalBed =
                bedRepository.findById(bedId);

        if (optionalBed.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy giường!");
        }

        Bed bed = optionalBed.get();

        // Kiểm tra giường thuộc đúng phòng
        if (bed.getRoom() == null
                || !bed.getRoom().getId().equals(roomId)) {

            return ResponseEntity.badRequest()
                    .body("Giường không thuộc phòng đã chọn!");
        }

        // Chỉ được đăng ký giường AVAILABLE
        if (!"AVAILABLE".equalsIgnoreCase(bed.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Giường này hiện không còn trống!");
        }

        // Không cho 2 đơn cùng chờ trên một giường
        boolean bedAlreadyRequested =
                registrationRepository.existsByBedIdAndStatusIn(
                        bedId,
                        List.of("PENDING", "APPROVED")
                );

        if (bedAlreadyRequested) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Giường này đã có sinh viên đăng ký!");
        }

        Registration registration = new Registration();

        registration.setStudent(student);
        registration.setRoom(room);
        registration.setBed(bed);

        // Theo Use Case: Chờ duyệt
        registration.setStatus("PENDING");

        Registration saved =
                registrationRepository.save(registration);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(saved);
    }


    // =========================
    // XEM ĐƠN CỦA SINH VIÊN
    // =========================

    @GetMapping("/my")
    public ResponseEntity<?> getMyRegistrations(
            java.security.Principal principal
    ) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Bạn chưa đăng nhập!");
        }

        Optional<User> student =
                userRepository.findByUsername(
                        principal.getName()
                );

        if (student.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy sinh viên!");
        }

        return ResponseEntity.ok(
                registrationRepository
                        .findByStudentIdOrderByCreatedAtDesc(
                                student.get().getId()
                        )
        );
    }

//        thông tin phongf hiện tại
    @GetMapping("/room")
    public ResponseEntity<?> getMyRoom(
            java.security.Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Bạn chưa đăng nhập");
        }
        Optional<User> optionalStudent = userRepository.findByUsername(principal.getName());

        if (optionalStudent.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy sinh viên");
        }

        User student = optionalStudent.get();

        List<Registration> registrations = registrationRepository
                .findByStudentIdOrderByCreatedAtDesc(student.getId());

//        Tìm đơn hiện tại
        Registration approvedRegistration = registrations.stream()
                .filter(r -> "APPROVED".equalsIgnoreCase(r.getStatus()))
                .findFirst()
                .orElse(null);

        if (approvedRegistration == null) {
            return ResponseEntity.ok(
                    Map.of(
                            "hasRoom", false,
                            "message", "Bạn chưa được phân phòng KTX."
                    )
            );
        }
        Room room = approvedRegistration.getRoom();
        Bed bed = approvedRegistration.getBed();

        Map<String, Object> result = new LinkedHashMap<>();

        result.put("hasRoom", true);

        result.put("roomId", room.getId());
        result.put("roomNumber", room.getRoomNumber());
        result.put("capacity", room.getCapacity());
        result.put("roomStatus", room.getStatus());

        if (room.getBuilding() != null) {
            result.put("buildingId", room.getBuilding().getId());
            result.put("buildingCode", room.getBuilding().getCode());
            result.put("buildingName", room.getBuilding().getName());
        }
        result.put("bedId", bed.getId());
        result.put("bedNumber", bed.getBedNumber());
        result.put("bedStatus", bed.getStatus());

        return ResponseEntity.ok(result);
    }

}