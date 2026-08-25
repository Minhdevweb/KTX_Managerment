
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
        const expirationTime = payload.exp * 1000;

        return Date.now() < expirationTime;

    } catch (error) {

        console.error(
            "JWT không hợp lệ:", error
        );

        return false;
    }
}

// ĐĂNG XUẤT

function logout(expired = false) {

    localStorage.removeItem("token");
    localStorage.removeItem("username");

    if (logoutTimer) {
        clearTimeout(logoutTimer);
    }

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

        const expirationTime =
            payload.exp * 1000;

        const timeLeft =
            expirationTime - Date.now();


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

// CHẠY KHI TRANG LOAD

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateAuthUI();

        if (
            document.body.dataset.requireLogin === "true"
        ) {
            requireLogin();
        }

    }
);

// HIỂN THỊ TRẠNG THÁI ĐĂNG NHẬP

function updateAuthUI() {

    const authArea = document.getElementById("authArea");

    if (!authArea) {
        return;
    }

    const token = getToken();
    const username = getUsername();

    // Chưa đăng nhập
    if (!token || !isTokenValid()) {

        authArea.innerHTML = `
            <a href="/html/login.html" class="login-button">
                ↪ ĐĂNG NHẬP
            </a>
        `;
        return;
    }

    // Đã đăng nhập
    authArea.innerHTML = `
        <div class="user-menu">

            <span class="welcome-user">
                👤 Xin chào, ${username}
            </span>

            <button
                class="logout-button"
                onclick="logout(false)"
            >
                🚪 ĐĂNG XUẤT
            </button>
        </div>
    `;
}