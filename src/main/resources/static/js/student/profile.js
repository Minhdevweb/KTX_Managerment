const profileForm = document.getElementById("profileForm");

const profileMessage = document.getElementById("profileMessage");

const saveButton = document.getElementById("saveButton");

// HIỂN THỊ THÔNG BÁO

function showMessage(message, success = false) {

    profileMessage.textContent = message;

    if (success) {
        profileMessage.style.color = "#16803c";

    } else {
        profileMessage.style.color = "#c0392b";
    }
}

// LẤY THÔNG TIN PROFILE

async function loadProfile() {

    const token = getToken();

    // Không có token
    if (!token) {
        logout(true);
        return;
    }


    try {

        const response = await fetch(
            "/api/profile",
            {

                method: "GET",

                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        // JWT hết hạn
        if (response.status === 401) {
            logout(true);
            return;
        }

        const text = await response.text();
        let data = {};
        if (text.trim() !== "") {
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Backend trả về không phải JSON:", text);
            }
        }

        if (!response.ok) {

            throw new Error(
                data.message || data.mess || text || "Không thể lấy thông tin cá nhân");
        }

        // Backend có thể trả:
        // { user: {...} }
        //
        // hoặc:
        // { id: ..., username: ... }

        const user = data.user || data;

        // ĐIỀN DỮ LIỆU

        document.getElementById("userId").value = user.id ?? "";


        document.getElementById("name").value =
            user.name ??
            user.fullName ?? "";

        document.getElementById("username").value =
            user.username ?? "";

        document.getElementById("email").value =
            user.email ?? "";


        document.getElementById("numberPhone").value =
            user.numberPhone ??
            user.phone ?? "";


        document.getElementById("role").value =
            user.role?.name ??
            user.role ?? "STUDENT";

    } catch (error) {

        console.error(
            "Lỗi lấy thông tin Profile:",
            error
        );

        showMessage(
            error.message ||
            "Không thể tải thông tin cá nhân"
        );
    }
}

// CẬP NHẬT PROFILE

profileForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const token = getToken();

        if (!token) {
            logout(true);
            return;
        }

        // Khóa nút trong lúc lưu

        saveButton.disabled = true;
        saveButton.textContent = "Đang lưu...";
        showMessage("");

        // DỮ LIỆU GỬI BACKEND

        const body = {

            name: document.getElementById("name").value.trim(),

            username: document.getElementById("username").value.trim(),

            email: document.getElementById("email").value.trim(),

            numberPhone: document.getElementById("numberPhone").value.trim()
        };

        try {

            const response = await fetch(
                "/api/profile",
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " + token

                    },

                    body:
                        JSON.stringify(body)
                }
            );

            // JWT hết hạn

            if (response.status === 401) {
                logout(true);
                return;
            }

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message || data.mess || "Cập nhật thất bại.");
            }

            const user = data.user || data;

            // CẬP NHẬT USERNAME

            if (user.username) {

                localStorage.setItem(
                    "username",
                    user.username
                );

            }

            document.getElementById("username").value =
                user.username ?? body.username;

            // HIỂN THỊ THÀNH CÔNG

            // HIỂN THỊ THÀNH CÔNG

            showMessage(
                "Cập nhật thông tin thành công!",
                true
            );

// Chờ 1 giây rồi quay về Student Dashboard
            setTimeout(() => {
                window.location.href = "/html/student/dashboard.html";
            }, 1000);


        } catch (error) {

            console.error(
                "Lỗi cập nhật Profile:",
                error
            );


            showMessage(
                error.message ||
                "Không thể cập nhật thông tin"
            );


        } finally {
            saveButton.disabled = false;
            saveButton.textContent = "LƯU THAY ĐỔI";
        }
    }
);

// KHI TRANG ĐƯỢC MỞ

document.addEventListener(
    "DOMContentLoaded",
    function () {

        document.getElementById(
            "welcomeUser"
        ).textContent = "Xin chào, " + getUsername();
        loadProfile();
    }
);