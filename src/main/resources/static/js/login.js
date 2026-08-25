const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");


loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    // Xóa thông báo cũ
    loginMessage.className = "login-message";
    loginMessage.textContent = "";


    // Disable button
    loginButton.disabled = true;
    loginButton.textContent = "ĐANG ĐĂNG NHẬP...";


    try {
        const response = await fetch(
            "/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    username: username,
                    password: password
                })
            }
        );

        const data = await response.json();

        // ĐĂNG NHẬP THÀNH CÔNG

        if (response.ok) {

            // Lưu JWT
            localStorage.setItem(
                "token",
                data.token
            );


            // Lưu username
            localStorage.setItem(
                "username",
                username
            );


            loginMessage.className =
                "login-message success";

            loginMessage.textContent =
                "Đăng nhập thành công!";


            /*
             * Tạm thời chuyển về trang chủ.
             *
             * Sau sẽ kiểm tra role
             * và chuyển:
             *
             * STUDENT → student/dashboard.html
             * ADMIN   → admin/dashboard.html
             */
        // hết thời gian sẽ timeout
            setTimeout(function () {

                window.location.href = "/html/index.html";

            }, 800);

        }
            // ĐĂNG NHẬP THẤT BẠI

        else {

            loginMessage.className =
                "login-message error";

            if (response.status === 401) {
                loginMessage.textContent = "Tên đăng nhập hoặc mật khẩu không đúng.";

            }
            else if (response.status === 403) {
                loginMessage.textContent = "Bạn không có quyền đăng nhập.";
            }

            else {
                loginMessage.textContent = data.message || "Đăng nhập thất bại.";
            }
        }

    }

    catch (error) {

        console.error("Lỗi đăng nhập:", error);


        loginMessage.className = "login-message error";
        loginMessage.textContent = "Không thể kết nối đến máy chủ.";
    }

    finally {
        loginButton.disabled = false;
        loginButton.textContent = "ĐĂNG NHẬP";
    }
});