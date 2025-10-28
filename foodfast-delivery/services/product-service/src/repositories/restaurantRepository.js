// src/repositories/restaurantRepository.js
const mongoose = require('mongoose');

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
        const Restaurant = mongoose.models.Restaurant;
        return await Restaurant.findOne({ ownerId });
    }
}

module.exports = new RestaurantRepository();
