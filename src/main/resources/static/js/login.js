const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");


loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value;


    loginMessage.className = "login-message";
    loginMessage.textContent = "";

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

            const token = data.token;

            // Kiểm tra Backend có trả JWT không
            if (!token) {
                throw new Error(
                    "Backend không trả về token."
                );
            }

            // ĐỌC JWT

            let payload;

            try {

                payload = JSON.parse(
                    atob(token.split(".")[1])
                );

            } catch (error) {
                throw new Error(
                    "Token JWT không hợp lệ."
                );
            }

            const role = payload.role;
            const userId = payload.userId;


            console.log("========== LOGIN ==========");
            console.log("Username:", username);
            console.log("User ID:", userId);
            console.log("Role:", role);
            console.log("Token:", token);
            console.log("===========================");

            // LƯU THÔNG TIN ĐĂNG NHẬP
            localStorage.setItem(
                "token",
                token
            );

            localStorage.setItem(
                "username",
                username
            );

            localStorage.setItem(
                "role",
                role
            );

            localStorage.setItem(
                "userId",
                userId
            );

            // THÔNG BÁO

            loginMessage.className = "login-message success";

            loginMessage.textContent = "Đăng nhập thành công!";

            // CHUYỂN TRANG THEO ROLE

            setTimeout(function () {

                if (role === "ADMIN") {
                    window.location.href = "/html/admin/dashboard.html";
                }

                else if (role === "STUDENT") {
                    window.location.href = "/html/student/dashboard.html";
                }

                else {
                    console.error(
                        "Role không hợp lệ:",
                        role
                    );

                    localStorage.clear();
                    loginMessage.className = "login-message error";
                    loginMessage.textContent = "Tài khoản chưa được phân quyền.";
                }
            }, 800);
        }

            // ĐĂNG NHẬP THẤT BẠi

        else {
            loginMessage.className = "login-message error";

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
        console.error(
            "Lỗi đăng nhập:",
            error
        );

        loginMessage.className = "login-message error";
        loginMessage.textContent = "Không thể kết nối đến máy chủ.";
    }

    finally {

        loginButton.disabled = false;
        loginButton.textContent = "ĐĂNG NHẬP";
    }
});