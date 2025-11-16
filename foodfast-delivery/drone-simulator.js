const SockJS = require('sockjs-client');
const { Client } = require('@stomp/stompjs');

/**
 * 🚁 Drone GPS Simulator
 * Mô phỏng chuyến bay của drone từ nhà hàng đến địa điểm giao hàng
 * Gửi GPS updates theo thời gian thực qua WebSocket
 */

class DroneSimulator {
  constructor(droneId, orderId, restaurantLat, restaurantLng, destLat, destLng) {
    this.droneId = droneId;
    this.orderId = orderId;
    this.currentLat = restaurantLat;
    this.currentLng = restaurantLng;
    this.destLat = destLat;
    this.destLng = destLng;
    this.batteryPercent = 100;
    this.speed = 30; // km/h
    this.client = null;
    this.intervalId = null;
  }

  // Tính khoảng cách Haversine (km)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radius of Earth in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return (degrees * Math.PI) / 180;
  }

  // Di chuyển drone theo hướng đích
  moveTowardsDestination() {
    const distance = this.calculateDistance(
      this.currentLat,
      this.currentLng,
      this.destLat,
      this.destLng
    );

    if (distance < 0.1) {
      // Đã đến nơi
      console.log('🎯 Drone arrived at destination!');
      this.sendArrivedNotification();
      setTimeout(() => {
        this.sendDeliveredNotification();
        this.stop();
      }, 5000); // Đợi 5s để "giao hàng"
      return false;
    }

    // Di chuyển 1 bước nhỏ về phía đích
    const stepSize = 0.0005; // Khoảng 50m mỗi bước
    const latDiff = this.destLat - this.currentLat;
    const lngDiff = this.destLng - this.currentLng;
    const totalDiff = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

    this.currentLat += (latDiff / totalDiff) * stepSize;
    this.currentLng += (lngDiff / totalDiff) * stepSize;

    // Giảm pin (5% mỗi km)
    const batteryLoss = distance * 0.05;
    this.batteryPercent = Math.max(0, this.batteryPercent - batteryLoss * 0.1);

    return true;
  }

  // Gửi GPS update qua WebSocket
  sendGpsUpdate() {
    if (!this.client || !this.client.connected) {
      console.warn('⚠️ WebSocket not connected');
      return;
    }

    const update = {
      lat: this.currentLat,
      lng: this.currentLng,
      batteryPercent: this.batteryPercent,
      speedKmh: this.speed,
      timestamp: new Date().toISOString(),
    };

    try {
      this.client.publish({
        destination: '/app/drone/update',
        body: JSON.stringify({
          droneId: this.droneId,
          ...update,
        }),
      });
      console.log(`📡 GPS Update: ${this.currentLat.toFixed(6)}, ${this.currentLng.toFixed(6)} | Battery: ${this.batteryPercent.toFixed(1)}%`);
    } catch (error) {
      console.error('❌ Error sending GPS update:', error);
    }
  }

  sendArrivedNotification() {
    if (!this.client || !this.client.connected) return;

    this.client.publish({
      destination: '/app/drone/arrived',
      body: JSON.stringify({
        droneId: this.droneId,
        orderId: this.orderId,
      }),
    });
    console.log('🛬 Sent arrived notification');
  }

  sendDeliveredNotification() {
    if (!this.client || !this.client.connected) return;

    this.client.publish({
      destination: '/app/drone/delivered',
      body: JSON.stringify({
        droneId: this.droneId,
        orderId: this.orderId,
      }),
    });
    console.log('✅ Sent delivered notification');
  }

  // Kết nối WebSocket và bắt đầu simulation
  start() {
    console.log('🚁 Starting Drone Simulator...');
    console.log(`   Drone ID: ${this.droneId}`);
    console.log(`   Order ID: ${this.orderId}`);
    console.log(`   From: ${this.currentLat}, ${this.currentLng}`);
    console.log(`   To: ${this.destLat}, ${this.destLng}`);

    const socket = new SockJS('http://localhost:8080/ws');
    this.client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log('STOMP:', str),
      reconnectDelay: 5000,
    });

    this.client.onConnect = () => {
      console.log('✅ WebSocket connected');

      // Gửi GPS update mỗi 2 giây
      this.intervalId = setInterval(() => {
        const continueMoving = this.moveTowardsDestination();
        if (continueMoving) {
          this.sendGpsUpdate();
        }
      }, 2000);
    };

    this.client.onStompError = (frame) => {
      console.error('❌ STOMP error:', frame.headers['message']);
    };

    this.client.activate();
  }

  stop() {
    console.log('🛑 Stopping simulator...');
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.client) {
      this.client.deactivate();
    }
  }
}

// Usage: node drone-simulator.js <droneId> <orderId> <restaurantLat> <restaurantLng> <destLat> <destLng>
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 6) {
    console.error('Usage: node drone-simulator.js <droneId> <orderId> <restaurantLat> <restaurantLng> <destLat> <destLng>');
    console.error('Example: node drone-simulator.js 1 123 10.762622 106.660172 10.772622 106.670172');
    process.exit(1);
  }

  const [droneId, orderId, restaurantLat, restaurantLng, destLat, destLng] = args.map(Number);

  const simulator = new DroneSimulator(droneId, orderId, restaurantLat, restaurantLng, destLat, destLng);
  simulator.start();

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n⏹️ Shutting down...');
    simulator.stop();
    process.exit(0);
  });
}

module.exports = DroneSimulator;
