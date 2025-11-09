// src/repositories/restaurantRepository.js
const mongoose = require('mongoose');
const { Restaurant } = require("../models/Restaurant");

class RestaurantRepository {
    async createRestaurant(restaurantData) {
        const Restaurant = mongoose.models.Restaurant;
        const restaurant = new Restaurant(restaurantData);
        return await restaurant.save();
    }

    async getRestaurantById(restaurantId) {
        const Restaurant = mongoose.models.Restaurant;
        return await Restaurant.findById(restaurantId);
    }

    async getAllRestaurants() {
        const Restaurant = mongoose.models.Restaurant;
        return await Restaurant.find();
    }

    async findByOwnerId(ownerId) {
        return await Restaurant.findOne({ owner_id: ownerId });
    }
    async approveRestaurantByOwnerId(ownerId) {
        const Restaurant = mongoose.models.Restaurant;
        return await Restaurant.findOneAndUpdate(
        { owner_id: ownerId }, // Tìm bằng owner_id
        { $set: { isActive: true } }, // Kích hoạt
        { new: true }
        );
    }
    async setOnlineRestaurant(ownerId, isOnline) {
        const Restaurant = mongoose.models.Restaurant;
        return await Restaurant.findOneAndUpdate(
        { owner_id: ownerId },
        { $set: { isOnline: isOnline } },
        { new: true }
        );
    }
}

module.exports = new RestaurantRepository();
