const redisClient = require('../config/redis'); //
const restaurantService = require('../services/restaurantService'); //
const RestaurantRepository = require('../repositories/restaurantRepository'); //
const productService = require('../services/productService');

// Tạo một client riêng cho việc lắng nghe
const subscriber = redisClient.duplicate();
const RESTAURANT_CHANNEL = 'restaurant.user.created';
const APPROVAL_CHANNEL = 'restaurant.user.approved';
const LOGIN_CHANNEL = 'restaurant.user.loggedin';     
const LOGOUT_CHANNEL = 'restaurant.user.loggedout';
const ORDER_CONFIRMED_CHANNEL = 'order.confirmed';

const startSubscriber = async () => {
  try {
    
    // 1. ĐỊNH NGHĨA "MÁY NGHE" TIN NHẮN TRƯỚC
    // Đây là nơi xử lý logic khi nhận được tin nhắn
    subscriber.on('message', async (channel, message) => {
      
      // Chỉ xử lý tin nhắn từ kênh (channel) mà chúng ta quan tâm
      if (channel === RESTAURANT_CHANNEL) {
        console.log(`✅ [Redis Sub] Received message from channel '${channel}'`);
        
        try {
          const event = JSON.parse(message); // <-- Bây giờ 'message' MỚI thực sự là nội dung tin

          // Thêm kiểm tra để đảm bảo 'event' không bị null
          if (!event || !event.eventType) {
             console.error('❌ [Redis Sub] Invalid event structure:', event);
             return;
          }

          if (event.eventType === 'RestaurantUserCreated') {
            const { userId, restaurantName, restaurantAddress, phone } = event.payload;

            if (!userId || !restaurantName || !restaurantAddress) {
               console.error('❌ [Redis Sub] Invalid message payload:', event.payload);
               return;
            }

            const existing = await RestaurantRepository.findByOwnerId(userId);
            if (existing) {
              console.warn(`⚠️ [Redis Sub] Restaurant for owner ${userId} already exists. Skipping.`);
              return;
            }

            // Chuẩn bị dữ liệu
            const restaurantData = {
              owner_id: userId,
              restaurantId: userId,
              name: restaurantName,
              address: restaurantAddress,
              phone: phone,
              isActive: false,
              isOnline: false
            };

            const newRestaurant = await restaurantService.createRestaurant(restaurantData);
            console.log(`✅ [Redis Sub] Successfully created restaurant in MongoDB: ${newRestaurant.name}`);
          }
        } catch (err) {
          console.error('❌ [Redis Sub] Error processing message:', err.message);
        }
      }
      else if (channel === APPROVAL_CHANNEL) {
        console.log(`✅ [Redis Sub] Received message from channel '${channel}'`);
        try {
          const event = JSON.parse(message);
          if (event.eventType === 'RestaurantUserApproved') {
            const { userId } = event.payload;
            const updatedRestaurant = await RestaurantRepository.approveRestaurantByOwnerId(userId);
            if (updatedRestaurant) {
              console.log(`✅ [Redis Sub] Successfully activated restaurant: ${updatedRestaurant.name}`);
            } else {
              console.warn(`⚠️ [Redis Sub] Could not find restaurant for owner ${userId} to approve.`);
            }
          }
        } catch (err) {
          console.error('❌ [Redis Sub] Error processing approval:', err.message);
        }
      }
      else if (channel === LOGIN_CHANNEL) {
        console.log(`✅ [Redis Sub] Received message from channel '${channel}'`);
        try {
          const event = JSON.parse(message);
          if (event.eventType === 'RestaurantUserLoggedIn') {
            const { userId } = event.payload;
            const restaurant = await RestaurantRepository.setOnlineStatusByOwnerId(userId, true);
            if (restaurant) {
              console.log(`✅ [Redis Sub] Set ${restaurant.name} to ONLINE.`);
            }
          }
        } catch (err) {
          console.error('❌ [Redis Sub] Error processing login event:', err.message);
        }
      }

      else if (channel === LOGOUT_CHANNEL) {
        console.log(`✅ [Redis Sub] Received message from channel '${channel}'`);
        try {
          const event = JSON.parse(message);
          if (event.eventType === 'RestaurantUserLoggedOut') {
            const { userId } = event.payload;
            const restaurant = await RestaurantRepository.setOnlineStatusByOwnerId(userId, false);
            if (restaurant) {
              console.log(`✅ [Redis Sub] Set ${restaurant.name} to OFFLINE.`);
            }
          }
        } catch (err) {
          console.error('❌ [Redis Sub] Error processing logout event:', err.message);
        }
      }

      else if (channel === ORDER_CONFIRMED_CHANNEL) {
        console.log(`✅ [Redis Sub] Received message from channel '${channel}'`);
        console.log(`[Redis Sub] Raw message:`, message);
        try {
            const event = JSON.parse(message);
            console.log(`[Redis Sub] Parsed event:`, JSON.stringify(event, null, 2));
            
            // Giả định event có eventType và payload.items
            if (event.eventType === 'OrderConfirmed' && event.payload && event.payload.items) {
                console.log(`[Redis Sub] Processing OrderConfirmed event with ${event.payload.items.length} items`);
                console.log(`[Redis Sub] Order ID: ${event.payload.orderId}`);
                console.log(`[Redis Sub] Items:`, JSON.stringify(event.payload.items, null, 2));
                
                // event.payload.items có dạng [{ productId: "...", quantity: 2 }, ...]
                await productService.handleStockUpdate(event.payload.items);
                console.log(`✅ [Redis Sub] Stock successfully decremented for order ${event.payload.orderId}.`);
            } else {
                 console.warn(`[Redis Sub] Invalid event structure on ${ORDER_CONFIRMED_CHANNEL}`);
                 console.warn(`[Redis Sub] Event structure:`, JSON.stringify(event, null, 2));
                 console.warn(`[Redis Sub] Event type: ${event.eventType}`);
                 console.warn(`[Redis Sub] Has payload: ${!!event.payload}`);
                 console.warn(`[Redis Sub] Has items: ${!!(event.payload && event.payload.items)}`);
            }

        } catch (err) {
            console.error('❌ [Redis Sub] Error processing order confirmation:', err.message);
            console.error('❌ [Redis Sub] Error stack:', err.stack);
        }
      }
    });
    

    // 2. LẮNG NGHE SỰ KIỆN "READY"
    // Chỉ sau khi kết nối sẵn sàng, chúng ta mới đăng ký (subscribe) kênh
    subscriber.on('ready', async () => {
      try {
        await subscriber.subscribe(RESTAURANT_CHANNEL);
        console.log(`✅ [Redis Sub] Subscribed to channel: ${RESTAURANT_CHANNEL}`);
        
        await subscriber.subscribe(APPROVAL_CHANNEL);
        console.log(`✅ [Redis Sub] Subscribed to channel: ${APPROVAL_CHANNEL}`);

        await subscriber.subscribe(LOGIN_CHANNEL);  
        console.log(`✅ [Redis Sub] Subscribed to channel: ${LOGIN_CHANNEL}`);

        await subscriber.subscribe(LOGOUT_CHANNEL);
        console.log(`✅ [Redis Sub] Subscribed to channel: ${LOGOUT_CHANNEL}`);

        await subscriber.subscribe(ORDER_CONFIRMED_CHANNEL);
        console.log(`✅ [Redis Sub] Subscribed to channel: ${ORDER_CONFIRMED_CHANNEL}`);
      } catch (err) {
        console.error('❌ [Redis Sub] Failed to subscribe:', err.message);
      }
    });

    // 3. LẮNG NGHE SỰ KIỆN "ERROR"
    subscriber.on('error', (err) => {
        console.error('❌ [Redis Sub] Subscriber connection error:', err);
    });

    console.log('✅ [Redis Sub] Subscriber is connecting...');

  } catch (err) {
    console.error('❌ [Redis Sub] Failed to initialize subscriber:', err.message);
    process.exit(1); 
  }
};

module.exports = { startSubscriber };
