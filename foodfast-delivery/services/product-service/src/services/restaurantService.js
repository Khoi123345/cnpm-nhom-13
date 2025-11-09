const RestaurantRepository = require('../repositories/restaurantRepository');

class RestaurantService {
    async createRestaurant(restaurantData) {
        return await RestaurantRepository.createRestaurant(restaurantData);
    }
    async getRestaurantById(restaurantId) {
        return await RestaurantRepository.getRestaurantById(restaurantId);
    }
    async getAllRestaurants() {
        return await RestaurantRepository.getAllRestaurants();
    }
    async findByOwnerId(ownerId) {
        return await RestaurantRepository.findByOwnerId(ownerId);
    }
    async setOnlineRestaurant(ownerId, isOnline) {
        const restaurant = await RestaurantRepository.setOnlineRestaurant(ownerId, isOnline);
        if (!restaurant) {
            throw new Error("Restaurant not found for this owner");
        }
        return restaurant;
    }
}

module.exports = new RestaurantService();
