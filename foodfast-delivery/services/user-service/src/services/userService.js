const bcrypt = require('bcrypt');
const UserRepository = require('../repositories/userRepository'); // Import repository
const messageBroker = require('../utils/messageBroker'); // Import message broker utility

const SALT_ROUNDS = 10;

class UserService {
async getAllUsers(filters = {}, page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  // Gọi repository (đã có sẵn hàm findAllAndCount)
  const result = await UserRepository.findAllAndCount({
    limit,
    offset,
    filters
  });

  // Tính tổng số trang
  const totalPages = Math.ceil(result.totalItems / limit);

  return {
    users: result.users,
    totalItems: result.totalItems,
    currentPage: page,
    totalPages
  };
}
  /**
 * Create restaurant user and publish event
 */
async createRestaurantUser(restaurantData) {
  const { email, password, phone, restaurant_name, restaurant_address } = restaurantData;

  // Check if email already exists
  const existingUser = await userRepository.existsByEmail(email);
  if (existingUser) {
    throw new Error('Email already exists');
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user with RESTAURANT role and is_active = false
  const newUser = await userRepository.create({
    email,
    password_hash,
    full_name: restaurant_name,
    phone,
    role: 'RESTAURANT',
    is_active: false
  });

  // Publish RestaurantUserCreated event với routing key pattern
  const eventPayload = {
    eventType: 'RestaurantUserCreated',
    payload: {
      userId: newUser.id,
      email: newUser.email,
      restaurantName: restaurant_name,
      restaurantAddress: restaurant_address,
      phone: newUser.phone,
      timestamp: new Date().toISOString()
    }
  };

  try {
    // Routing key: 'restaurant.user.created'
    await messageBroker.publish('restaurant.user.created', eventPayload);
  } catch (error) {
    console.error('⚠️  Failed to publish event, but user was created:', error);
    // User đã được tạo, không throw error để không rollback
  }

  return {
    user: newUser,
    message: 'Restaurant registration submitted successfully. Your account is pending approval.'
  };
}
  /**
   * Create new user (Business Logic)
   */
  async createUser(userData) {
    const { email, password, full_name, phone, role = 'CUSTOMER' } = userData;

    // Business Logic: Check if user already exists
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Business Logic: Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Call Repository to save data
    const newUser = await UserRepository.createUser({
      email,
      password_hash,
      full_name,
      phone,
      role,
    });

    return newUser;
  }

  /**
   * Find user by email (Pass-through to repository)
   */
  async findByEmail(email) {
    return UserRepository.findByEmail(email);
  }

  /**
   * Find user by ID (Pass-through to repository)
   */
  async findById(userId) {
    return UserRepository.findById(userId);
  }

  /**
   * Update user profile (Business Logic)
   */
  async updateUser(userId, userData) {
    // Call repository to update data
    const updatedUser = await UserRepository.updateUser(userId, userData);

    // Business Logic: Check if user was found and updated
    if (!updatedUser) {
      throw new Error('User not found');
    }

    return updatedUser;
  }

  /**
   * Verify password (Pure Business Logic)
   */
  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Soft delete user (Business Logic)
   */
  async deleteUser(userId) {
    const rowCount = await UserRepository.deleteUser(userId);
    
    // Business Logic: Check if user was found and deleted
    if (rowCount === 0) {
      throw new Error('User not found');
    }
  }
}

module.exports = new UserService();