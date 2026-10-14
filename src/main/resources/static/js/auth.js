
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

    if (!authArea) return;

    const username = getUsername();
    const role = getRole();

    // Chưa đăng nhập hoặc token hết hạn
    if (!isTokenValid()) {
        authArea.innerHTML = `
            <a href="/html/login.html" class="login-button">
                ↪ ĐĂNG NHẬP
            </a>
        `;
        return;
    }

    const isAdmin = role === "ADMIN";

    const dashboardUrl = isAdmin
        ? "/html/admin/dashboard.html"
        : "/html/student/dashboard.html";

    const menuItems = isAdmin
        ? `
            <a href="/html/admin/dashboard.html">Trang quản trị</a>
            <a href="/html/admin/student-management.html">Quản lý sinh viên</a>
            <a href="/html/admin/room-management.html">Quản lý phòng</a>
            <a href="/html/admin/registration-management.html">Quản lý đăng ký KTX</a>
            <a href="/html/admin/statistics.html">Thống kê</a>
        `
        : `
            <a href="/html/student/dashboard.html">Trang sinh viên</a>
            <a href="/html/student/registration.html">Đăng ký KTX</a>
            <a href="/html/student/room.html">Thông tin phòng</a>
            <a href="/html/student/profile.html">Thông tin cá nhân</a>
        `;

    authArea.innerHTML = `
        <div class="account-menu" id="accountMenu">
            <button
                type="button"
                class="account-trigger"
                id="accountTrigger"
                aria-expanded="false"
                aria-controls="accountDropdown">
                Xin chào, ${escapeHTML(username || "Người dùng")} ▾
            </button>

            <div class="account-dropdown" id="accountDropdown" hidden>
                <div class="account-info">
                    <strong>${escapeHTML(username || "Người dùng")}</strong>
                    <span>${isAdmin ? "Quản trị viên" : "Sinh viên"}</span>
                </div>

                <div class="account-links">
                    ${menuItems}
                </div>

                <button
                    type="button"
                    class="account-logout"
                    id="accountLogout">
                    ĐĂNG XUẤT
                </button>
            </div>
        </div>
    `;

    const trigger = document.getElementById("accountTrigger");
    const dropdown = document.getElementById("accountDropdown");
    const logoutButton = document.getElementById("accountLogout");

    trigger.addEventListener("click", function (event) {
        event.stopPropagation();

        const isOpening = dropdown.hidden;
        dropdown.hidden = !isOpening;
        trigger.setAttribute("aria-expanded", String(isOpening));
    });

    dropdown.addEventListener("click", function (event) {
        event.stopPropagation();
    });

    document.addEventListener("click", function () {
        dropdown.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
    });

    logoutButton.addEventListener("click", function () {
        logout(false);
    });
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function updateHomeActions() {
    const section = document.getElementById("searchSection");
    const title = document.getElementById("searchTitle");
    const description = document.getElementById("searchDescription");
    const button = document.getElementById("searchActionButton");

    if (!section || !title || !description || !button) return;

    if (!isTokenValid()) {
        title.textContent = "TRA CỨU THÔNG TIN KÝ TÚC XÁ";
        description.textContent =
            "Sinh viên có thể tra cứu thông tin phòng và tình trạng ký túc xá sau khi đăng nhập.";

        button.href = "/html/login.html";
        button.textContent = "ĐĂNG NHẬP ĐỂ TRA CỨU";
        return;
    }

    const role = getRole();

    if (role === "ADMIN") {
        title.textContent = "KHU VỰC QUẢN TRỊ KÝ TÚC XÁ";
        description.textContent =
            "Quản lý sinh viên, phòng, đăng ký lưu trú và xem thống kê.";

        button.href = "/html/admin/dashboard.html";
        button.textContent = "VÀO TRANG QUẢN TRỊ";
    } else if (role === "STUDENT") {
        title.textContent = "KÝ TÚC XÁ CỦA BẠN";
        description.textContent =
            "Đăng ký lưu trú, xem thông tin phòng và quản lý thông tin cá nhân.";

        button.href = "/html/student/dashboard.html";
        button.textContent = "VÀO TRANG SINH VIÊN";
    }
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
        // cập nhật hành đôngj nút nhà
        updateHomeActions();

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