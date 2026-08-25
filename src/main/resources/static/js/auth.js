
// AUTH.JS
// QUẢN LÝ JWT CHUNG CHO TOÀN BỘ WEBSITE

let logoutTimer = null;

// LẤY TOKEN

function getToken() {
    return localStorage.getItem("token");
}

// LẤY USERNAME

function getUsername() {
    return localStorage.getItem("username");
}

// LẤY ROLE

function getRole() {
    return localStorage.getItem("role");
}

// KIỂM TRA JWT

function isTokenValid() {

    const token = getToken();

    if (!token) {
        return false;
    }

    try {

        // JWT = header.payload.signature
        const payload = JSON.parse(
            atob(token.split(".")[1])
        );

        // exp của JWT tính bằng giây
        const expirationTime =
            payload.exp * 1000;

        return Date.now() < expirationTime;

    } catch (error) {

        console.error(
            "JWT không hợp lệ:",
            error
        );

        return false;
    }
}

// ĐĂNG XUẤT

function logout(expired = false) {

    // Nếu người dùng tự bấm ĐĂNG XUẤT
    if (!expired) {

        const confirmLogout = confirm(
            "Bạn có chắc chắn muốn đăng xuất không?"
        );

        // Người dùng chọn Hủy
        if (!confirmLogout) {
            return;
        }
    }

    // Xóa thông tin đăng nhập
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");

    // Hủy timer nếu đang có
    if (logoutTimer) {
        clearTimeout(logoutTimer);
        logoutTimer = null;
    }


    // Chuyển về Login
    if (expired) {

        window.location.href = "/html/login.html?expired=true";

    } else {
        window.location.href = "/html/login.html";
    }
}

// TỰ ĐỘNG LOGOUT KHI JWT HẾT HẠN

function startTokenTimer() {

    const token = getToken();

    if (!token) {
        return;
    }

    try {

        const payload = JSON.parse(
            atob(token.split(".")[1])
        );

        const expirationTime = payload.exp * 1000;

        const timeLeft = expirationTime - Date.now();


        // Token đã hết hạn
        if (timeLeft <= 0) {

            logout(true);
            return;
        }


        console.log(
            "JWT còn:",
            Math.round(timeLeft / 1000),
            "giây"
        );

        // Đặt timer đến đúng thời điểm hết hạn
        logoutTimer = setTimeout(
            function () {
                logout(true);
            },
            timeLeft
        );

    } catch (error) {
        console.error(
            "Không thể đọc JWT:",
            error
        );
        logout(true);
    }
}

// BẢO VỆ TRANG

function requireLogin() {

    if (!isTokenValid()) {
        logout(true);
        return false;
    }

    // Token vẫn còn hạn
    startTokenTimer();
    return true;
}

// CẬP NHẬT THANH NAV

function updateAuthUI() {

    const authArea = document.getElementById("authArea");

    if (!authArea) {
        return;
    }

    const token = getToken();
    const username = getUsername();

    // CHƯA ĐĂNG NHẬP

    if (!token || !isTokenValid()) {

        authArea.innerHTML = `
            <a
                href="/html/login.html"
                class="login-button"
            >
                ĐĂNG NHẬP
            </a>
        `;
        return;
    }

    // ĐÃ ĐĂNG NHẬP

    authArea.innerHTML = `
        <div class="user-menu">

            <span class="welcome-user">
                 Xin chào, ${username}
            </span>

            <button
                class="logout-button"
                onclick="logout(false)"
            >
                 ĐĂNG XUẤT
            </button>

        </div>
    `;
}

// ẨN / HIỆN NÚT ĐĂNG NHẬP HỆ THỐNG

function updateHeroButton() {

    const heroLoginButton = document.getElementById("heroLoginButton");

    if (!heroLoginButton) {
        return;
    }


    // Đã đăng nhập
    if (isTokenValid()) {
        heroLoginButton.style.display = "none";
    }

    // Chưa đăng nhập
    else {
        heroLoginButton.style.display =
            "inline-block";
    }
}

// CHẠY KHI TRANG LOAD

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // Cập nhật thanh Navbar
        updateAuthUI();

        // Cập nhật nút Login trong Banner
        updateHeroButton();


        // Nếu trang yêu cầu đăng nhập
        if (
            document.body.dataset.requireLogin === "true"
        ) {
            requireLogin();
        }
    }
);