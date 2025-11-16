const SockJS = require('sockjs-client');
const { Client } = require('@stomp/stompjs');

/**
 * DRONE SIMULATOR
 * Giả lập drone bay từ nhà hàng đến địa chỉ khách hàng
 * Gửi GPS updates real-time qua WebSocket
 */

class DroneSimulator {
    constructor(droneId, startLat, startLng, destLat, destLng, orderId) {
        this.droneId = droneId;
        this.currentLat = startLat;
        this.currentLng = startLng;
        this.destLat = destLat;
        this.destLng = destLng;
        this.orderId = orderId;
        this.battery = 100.0;
        this.speed = 30.0; // km/h
        this.isFlying = false;
        this.stompClient = null;
    }

    // Kết nối WebSocket
    connect() {
        console.log(`[Drone ${this.droneId}] Connecting to WebSocket...`);
        
        // Tạo SockJS connection
        const socket = new SockJS('http://localhost:8080/ws');
        
        this.stompClient = new Client({
            webSocketFactory: () => socket,
            debug: (str) => {
                console.log(`[STOMP Debug] ${str}`);
            },
            onConnect: () => {
                console.log(`[Drone ${this.droneId}] WebSocket connected!`);
                this.startDelivery();
            },
            onStompError: (frame) => {
                console.error(`[Drone ${this.droneId}] STOMP error:`, frame.headers['message']);
            },
        });
        
        this.stompClient.activate();
    }

    // Bắt đầu giao hàng
    startDelivery() {
        this.isFlying = true;
        console.log(`[Drone ${this.droneId}] Taking off...`);
        console.log(`  From: (${this.currentLat}, ${this.currentLng})`);
        console.log(`  To: (${this.destLat}, ${this.destLng})`);
        
        // Gửi GPS updates mỗi 2 giây
        this.interval = setInterval(() => {
            if (this.isFlying) {
                this.updatePosition();
                this.sendGpsUpdate();
                this.updateBattery();

                // Kiểm tra đã đến nơi chưa
                const distance = this.calculateDistance(
                    this.currentLat, this.currentLng,
                    this.destLat, this.destLng
                );
                
                if (distance < 0.01) { // < 10 meters
                    this.arrive();
                }
            }
        }, 2000); // 2 giây
    }

    // Cập nhật vị trí (di chuyển về phía đích)
    updatePosition() {
        const step = 0.0005; // ~50 meters per step
        
        const latDiff = this.destLat - this.currentLat;
        const lngDiff = this.destLng - this.currentLng;
        
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
        
        if (distance > step) {
            this.currentLat += (latDiff / distance) * step;
            this.currentLng += (lngDiff / distance) * step;
        } else {
            this.currentLat = this.destLat;
            this.currentLng = this.destLng;
        }
    }

    // Gửi GPS update lên server
    sendGpsUpdate() {
        const payload = {
            droneId: this.droneId,
            lat: this.currentLat,
            lng: this.currentLng,
            batteryPercent: this.battery,
            speedKmh: this.speed,
            altitudeMeters: 50.0
        };
        
        this.stompClient.publish({
            destination: '/app/drone/update',
            body: JSON.stringify(payload)
        });
        
        console.log(`[Drone ${this.droneId}] GPS: (${this.currentLat.toFixed(6)}, ${this.currentLng.toFixed(6)}) | Battery: ${this.battery.toFixed(1)}%`);
    }

    // Giảm pin
    updateBattery() {
        this.battery -= 0.5; // Giảm 0.5% mỗi 2 giây
        if (this.battery < 0) this.battery = 0;
    }

    // Đã đến nơi
    arrive() {
        this.isFlying = false;
        clearInterval(this.interval);
        
        console.log(`[Drone ${this.droneId}] ✅ ARRIVED at destination!`);
        
        this.stompClient.publish({
            destination: '/app/drone/arrived',
            body: JSON.stringify({
                droneId: this.droneId,
                orderId: this.orderId
            })
        });
        
        // Tự động nhận hàng sau 5 giây
        setTimeout(() => {
            this.completeDelivery();
        }, 5000);
    }

    // Hoàn thành giao hàng
    completeDelivery() {
        console.log(`[Drone ${this.droneId}] 📦 Delivery COMPLETED!`);
        
        this.stompClient.publish({
            destination: '/app/drone/delivered',
            body: JSON.stringify({
                droneId: this.droneId,
                orderId: this.orderId
            })
        });
        
        setTimeout(() => {
            console.log(`[Drone ${this.droneId}] Disconnecting...`);
            this.stompClient.deactivate();
            process.exit(0);
        }, 2000);
    }

    // Tính khoảng cách (Haversine formula)
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRad(deg) {
        return deg * (Math.PI / 180);
    }
}

// ========== CHẠY SIMULATOR ==========

// Tọa độ mẫu (Sài Gòn)
const RESTAURANT_LAT = 10.7769; // Nhà hàng (Q1)
const RESTAURANT_LNG = 106.7009;
const CUSTOMER_LAT = 10.8231;   // Khách hàng (Q Bình Thạnh)
const CUSTOMER_LNG = 106.6297;

const droneId = process.argv[2] || 1;
const orderId = process.argv[3] || 1;

console.log('='.repeat(50));
console.log('🚁 FOODFAST DRONE SIMULATOR');
console.log('='.repeat(50));
console.log(`Drone ID: ${droneId}`);
console.log(`Order ID: ${orderId}`);
console.log(`Restaurant: (${RESTAURANT_LAT}, ${RESTAURANT_LNG})`);
console.log(`Customer: (${CUSTOMER_LAT}, ${CUSTOMER_LNG})`);
console.log('='.repeat(50));

const drone = new DroneSimulator(
    droneId,
    RESTAURANT_LAT,
    RESTAURANT_LNG,
    CUSTOMER_LAT,
    CUSTOMER_LNG,
    orderId
);

drone.connect();
