const API_URL = "/api/admin/students";

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const emailInput = document.getElementById("email");
const fullNameInput = document.getElementById("fullName");
const phoneInput = document.getElementById("phone");

const addStudentButton = document.getElementById("addStudentButton");
const studentList = document.getElementById("studentList");
const messageBox = document.getElementById("message");


// ================= MESSAGE =================

function showMessage(message, type = "success") {

    messageBox.textContent = message;
    messageBox.className = "message " + type;

    setTimeout(() => {
        messageBox.className = "message";
        messageBox.textContent = "";
    }, 3000);
}


// ================= LOAD STUDENTS =================

async function loadStudents() {

    try {

        const token = getToken();

        const response = await fetch(API_URL, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) {

            if (response.status === 401) {
                showMessage(
                    "Phiên đăng nhập đã hết hạn!",
                    "error"
                );
                return;
            }

            if (response.status === 403) {
                showMessage(
                    "Bạn không có quyền quản lý sinh viên!",
                    "error"
                );
                return;
            }

            throw new Error(
                "Không thể tải danh sách sinh viên!"
            );
        }

        const students = await response.json();

        renderStudents(students);

    } catch (error) {

        console.error(error);

        showMessage(
            error.message || "Có lỗi xảy ra!",
            "error"
        );
    }
}


// ================= HIỂN THỊ SINH VIÊN =================

function renderStudents(students) {

    studentList.innerHTML = "";

    if (!students || students.length === 0) {

        studentList.innerHTML = `
            <div class="student-item">
                <div class="student-info">
                    <strong>Chưa có sinh viên</strong>
                    <span>Danh sách sinh viên đang trống.</span>
                </div>
            </div>
        `;

        return;
    }

    students.forEach(student => {

        const item = document.createElement("div");

        item.className = "student-item";

        item.innerHTML = `
            <div class="student-info">

                <strong>
                    ${escapeHtml(student.fullName || "Chưa cập nhật")}
                </strong>

                <span>
                    Username: ${escapeHtml(student.username || "")}
                </span>

                <span>
                    Email: ${escapeHtml(student.email || "")}
                </span>

                <span>
                    Số điện thoại:
                    ${escapeHtml(student.phone || "Chưa cập nhật")}
                </span>

            </div>

            <div class="item-actions">

                <button
                    class="edit-button"
                    onclick="editStudent(${student.id})">
                    Sửa
                </button>

                <button
                    class="delete-button"
                    onclick="deleteStudent(${student.id})">
                    Xóa
                </button>

            </div>
        `;

        studentList.appendChild(item);
    });
}


// ================= THÊM SINH VIÊN =================

addStudentButton.addEventListener("click", async function () {

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const email = emailInput.value.trim();
    const fullName = fullNameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (
        !username ||
        !password ||
        !email ||
        !fullName ||
        !phone
    ) {

        showMessage(
            "Vui lòng nhập đầy đủ thông tin!",
            "error"
        );

        return;
    }

    const token = getToken();

    if (!token) {

        showMessage(
            "Không tìm thấy token đăng nhập!",
            "error"
        );

        return;
    }

    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },

            body: JSON.stringify({
                username: username,
                password: password,
                email: email,
                fullName: fullName,
                phone: phone
            })
        });

        const responseText = await response.text();

        console.log("HTTP STATUS:", response.status);
        console.log("SERVER RESPONSE:", responseText);

        if (!response.ok) {

            showMessage(
                responseText || "Không thể thêm sinh viên!",
                "error"
            );

            return;
        }

        showMessage(
            "Thêm sinh viên thành công!",
            "success"
        );

        clearForm();

        loadStudents();

    } catch (error) {

        console.error("LỖI THÊM SINH VIÊN:", error);

        showMessage(
            "Lỗi kết nối: " + error.message,
            "error"
        );
    }
});


// ================= SỬA SINH VIÊN =================

async function editStudent(id) {

    try {

        const token = getToken();

        const response = await fetch(
            `${API_URL}/${id}`,
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (!response.ok) {

            showMessage(
                "Không tìm thấy sinh viên!",
                "error"
            );

            return;
        }

        const student = await response.json();

        const email = prompt(
            "Email:",
            student.email || ""
        );

        if (email === null) {
            return;
        }

        const fullName = prompt(
            "Họ và tên:",
            student.fullName || ""
        );

        if (fullName === null) {
            return;
        }

        const phone = prompt(
            "Số điện thoại:",
            student.phone || ""
        );

        if (phone === null) {
            return;
        }

        const newPassword = prompt(
            "Mật khẩu mới (để trống nếu không đổi):"
        );

        if (newPassword === null) {
            return;
        }

        const body = {
            email: email.trim(),
            fullName: fullName.trim(),
            phone: phone.trim()
        };

        if (newPassword.trim() !== "") {
            body.password = newPassword.trim();
        }

        const updateResponse = await fetch(
            `${API_URL}/${id}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },

                body: JSON.stringify(body)
            }
        );

        if (!updateResponse.ok) {

            const message =
                await updateResponse.text();

            showMessage(
                message || "Không thể cập nhật sinh viên!",
                "error"
            );

            return;
        }

        showMessage(
            "Cập nhật sinh viên thành công!",
            "success"
        );

        loadStudents();

    } catch (error) {

        console.error(error);

        showMessage(
            "Không thể cập nhật sinh viên!",
            "error"
        );
    }
}


// ================= XÓA SINH VIÊN =================

async function deleteStudent(id) {

    const confirmDelete = confirm(
        "Bạn có chắc chắn muốn xóa sinh viên này?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const token = getToken();

        const response = await fetch(
            `${API_URL}/${id}`,
            {
                method: "DELETE",

                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (!response.ok) {

            const message =
                await response.text();

            showMessage(
                message || "Không thể xóa sinh viên!",
                "error"
            );

            return;
        }

        showMessage(
            "Xóa sinh viên thành công!",
            "success"
        );

        loadStudents();

    } catch (error) {

        console.error(error);

        showMessage(
            "Không thể kết nối đến máy chủ!",
            "error"
        );
    }
}


// ================= XÓA FORM =================

function clearForm() {

    usernameInput.value = "";
    passwordInput.value = "";
    emailInput.value = "";
    fullNameInput.value = "";
    phoneInput.value = "";
}


// ================= CHỐNG HTML INJECTION =================

function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}


// ================= KHI MỞ TRANG =================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const username = getUsername();

        const welcomeUser =
            document.getElementById("welcomeUser");

        if (welcomeUser) {

            welcomeUser.textContent =
                "Xin chào, " + username;
        }

        loadStudents();
    }
);