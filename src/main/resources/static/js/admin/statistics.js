
document.addEventListener("DOMContentLoaded", () => {
    const refreshButton = document.getElementById("refreshButton");
    const loadingMessage = document.getElementById("loadingMessage");
    const errorMessage = document.getElementById("errorMessage");

    function getAuthToken() {
        if (typeof getToken === "function") {
            return getToken();
        }

        return localStorage.getItem("token");
    }

    function setText(id, value) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value ?? 0;
        }
    }

    function setBar(id, value, total) {
        const element = document.getElementById(id);

        if (!element) return;

        const percentage = total > 0
            ? Math.min(100, Math.max(0, value / total * 100))
            : 0;

        element.style.width = percentage + "%";
    }

    function formatNumber(value) {
        return Number(value ?? 0).toLocaleString("vi-VN");
    }

    async function loadStatistics() {
        loadingMessage.hidden = false;
        errorMessage.hidden = true;
        refreshButton.disabled = true;

        try {
            const token = getAuthToken();

            if (!token) {
                throw new Error(
                    "Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại."
                );
            }

            const response = await fetch("/api/admin/statistics", {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Accept": "application/json"
                }
            });

            if (response.status === 401) {
                throw new Error(
                    "Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại."
                );
            }

            if (response.status === 403) {
                throw new Error(
                    "Tài khoản hiện tại không có quyền ADMIN."
                );
            }

            if (!response.ok) {
                throw new Error(
                    "Không tải được thống kê. Mã lỗi: " + response.status
                );
            }

            const data = await response.json();

            // Tổng quan
            setText("totalStudents", formatNumber(data.totalStudents));
            setText("totalBuildings", formatNumber(data.totalBuildings));
            setText("totalRooms", formatNumber(data.totalRooms));
            setText("totalBeds", formatNumber(data.totalBeds));

            // Trạng thái giường
            const available = Number(data.availableBeds ?? 0);
            const occupied = Number(data.occupiedBeds ?? 0);
            const maintenance = Number(data.maintenanceBeds ?? 0);
            const totalBeds = Number(data.totalBeds ?? 0);

            setText("availableBeds", formatNumber(available));
            setText("occupiedBeds", formatNumber(occupied));
            setText("maintenanceBeds", formatNumber(maintenance));

            setBar("availableBedsBar", available, totalBeds);
            setBar("occupiedBedsBar", occupied, totalBeds);
            setBar("maintenanceBedsBar", maintenance, totalBeds);

            // Tỷ lệ sử dụng giường
            const occupancyRate = Math.min(
                100,
                Math.max(0, Number(data.occupancyRate ?? 0))
            );

            setText("occupancyRate", occupancyRate + "%");

            document.getElementById("occupancyChart")
                .style.setProperty("--occupancy", occupancyRate + "%");

            // Trạng thái phòng
            setText("availableRooms", formatNumber(data.availableRooms));
            setText("fullRooms", formatNumber(data.fullRooms));
            setText("maintenanceRooms", formatNumber(data.maintenanceRooms));

            // Trạng thái đăng ký
            setText("totalRegistrations", formatNumber(data.totalRegistrations));
            setText("pendingRegistrations", formatNumber(data.pendingRegistrations));
            setText("approvedRegistrations", formatNumber(data.approvedRegistrations));
            setText("rejectedRegistrations", formatNumber(data.rejectedRegistrations));

            setText(
                "lastUpdated",
                "Cập nhật lúc: " + new Date().toLocaleTimeString("vi-VN")
            );

        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.hidden = false;
        } finally {
            loadingMessage.hidden = true;
            refreshButton.disabled = false;
        }
    }

    refreshButton.addEventListener("click", loadStatistics);

    // Tải dữ liệu khi mở trang
    loadStatistics();
});
