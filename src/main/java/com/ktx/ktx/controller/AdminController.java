package com.ktx.ktx.controller;

import com.ktx.ktx.entity.Role;
import com.ktx.ktx.entity.User;
import com.ktx.ktx.repository.RoleRepository;
import com.ktx.ktx.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminController(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // =========================
    // TEST ADMIN
    // =========================

    @GetMapping("/test")
    public String adminTest() {
        return "Xin chào ADMIN! Bạn có quyền truy cập.";
    }

    // =========================
    // LẤY DANH SÁCH SINH VIÊN
    // =========================

    @GetMapping("/students")
    public ResponseEntity<List<User>> getAllStudents() {

        Optional<Role> studentRole =
                roleRepository.findByName("STUDENT");

        if (studentRole.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .build();
        }

        List<User> students =
                userRepository.findAll()
                        .stream()
                        .filter(user ->
                                user.getRole() != null
                                        && "STUDENT".equalsIgnoreCase(
                                        user.getRole().getName()
                                )
                        )
                        .toList();

        return ResponseEntity.ok(students);
    }

    // =========================
    // LẤY SINH VIÊN THEO ID
    // =========================

    @GetMapping("/students/{id}")
    public ResponseEntity<?> getStudentById(
            @PathVariable Long id
    ) {

        Optional<User> user =
                userRepository.findById(id);

        if (user.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy sinh viên!");
        }

        User student = user.get();

        if (student.getRole() == null
                || !"STUDENT".equalsIgnoreCase(
                student.getRole().getName()
        )) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy sinh viên!");
        }

        return ResponseEntity.ok(student);
    }

    // =========================
    // THÊM SINH VIÊN
    // =========================

    @PostMapping("/students")
    public ResponseEntity<?> createStudent(
            @RequestBody User user
    ) {

        if (user.getUsername() == null
                || user.getUsername().trim().isEmpty()) {

            return ResponseEntity
                    .badRequest()
                    .body("Tên đăng nhập không được để trống!");
        }

        if (user.getPassword() == null
                || user.getPassword().trim().isEmpty()) {

            return ResponseEntity
                    .badRequest()
                    .body("Mật khẩu không được để trống!");
        }

        if (user.getEmail() == null
                || user.getEmail().trim().isEmpty()) {

            return ResponseEntity
                    .badRequest()
                    .body("Email không được để trống!");
        }

        String username =
                user.getUsername().trim();

        String email =
                user.getEmail().trim();

        // Kiểm tra username
        if (userRepository.existsByUsername(username)) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("Tên đăng nhập đã tồn tại!");
        }

        // Kiểm tra email
        if (userRepository.existsByEmail(email)) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("Email đã tồn tại!");
        }

        // Lấy role STUDENT
        Optional<Role> studentRole =
                roleRepository.findByName("STUDENT");

        if (studentRole.isEmpty()) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy role STUDENT!");
        }

        user.setId(null);
        user.setUsername(username);
        user.setEmail(email);

        // Mã hóa mật khẩu
        user.setPassword(
                passwordEncoder.encode(
                        user.getPassword()
                )
        );

        // Không cho client tự truyền role khác
        user.setRole(studentRole.get());

        User savedUser =
                userRepository.save(user);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedUser);
    }

    // =========================
    // SỬA SINH VIÊN
    // =========================

    @PutMapping("/students/{id}")
    public ResponseEntity<?> updateStudent(
            @PathVariable Long id,
            @RequestBody User user
    ) {

        Optional<User> optionalStudent =
                userRepository.findById(id);

        if (optionalStudent.isEmpty()) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy sinh viên!");
        }

        User existingStudent =
                optionalStudent.get();

        if (existingStudent.getRole() == null
                || !"STUDENT".equalsIgnoreCase(
                existingStudent.getRole().getName()
        )) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy sinh viên!");
        }

        // Email
        if (user.getEmail() == null
                || user.getEmail().trim().isEmpty()) {

            return ResponseEntity
                    .badRequest()
                    .body("Email không được để trống!");
        }

        String email =
                user.getEmail().trim();

        // Kiểm tra email trùng
        Optional<User> userByEmail =
                userRepository.findByEmail(email);

        if (userByEmail.isPresent()
                && !userByEmail.get().getId().equals(id)) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("Email đã tồn tại!");
        }

        existingStudent.setEmail(email);

        existingStudent.setFullName(
                user.getFullName()
        );

        existingStudent.setPhone(
                user.getPhone()
        );

        // Nếu nhập mật khẩu mới thì mã hóa lại
        if (user.getPassword() != null
                && !user.getPassword().trim().isEmpty()) {

            existingStudent.setPassword(
                    passwordEncoder.encode(
                            user.getPassword()
                    )
            );
        }

        User updatedStudent =
                userRepository.save(existingStudent);

        return ResponseEntity.ok(updatedStudent);
    }

    // =========================
    // XÓA SINH VIÊN
    // =========================

    @DeleteMapping("/students/{id}")
    public ResponseEntity<?> deleteStudent(
            @PathVariable Long id
    ) {

        Optional<User> optionalStudent =
                userRepository.findById(id);

        if (optionalStudent.isEmpty()) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy sinh viên!");
        }

        User student =
                optionalStudent.get();

        if (student.getRole() == null
                || !"STUDENT".equalsIgnoreCase(
                student.getRole().getName()
        )) {

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Không thể xóa tài khoản ADMIN!");
        }

        userRepository.deleteById(id);

        return ResponseEntity.ok(
                "Xóa sinh viên thành công!"
        );
    }
}