const pool = require('../config/database');

class UserRepository {
  /**
   * Tạo một người dùng mới trong CSDL.
   * Đây là hàm tạo người dùng chính, linh hoạt và thay thế cho các hàm cũ.
   * @param {object} userData - { email, password_hash, full_name, phone, role, is_active }
   */
  async create(userData) {
    const {
      email,
      password_hash,
      full_name,
      phone,
      role = 'CUSTOMER', // Gán giá trị mặc định nếu không được cung cấp
      is_active = true,  // Mặc định là active
    } = userData;

    const query = `
      INSERT INTO users (email, password_hash, full_name, phone, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, full_name, phone, role, is_active, email_verified, created_at, updated_at
    `;

    const result = await pool.query(query, [
      email,
      password_hash,
      full_name,
      phone,
      role,
      is_active,
    ]);

    return result.rows[0];
  }

  /**
   * Tìm người dùng bằng email (bao gồm cả password_hash để xác thực).
   */
  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Tìm người dùng bằng ID (không bao gồm password_hash).
   */
  async findById(userId) {
    const query = `
      SELECT id, email, full_name, phone, role, is_active, email_verified, created_at, updated_at
      FROM users WHERE id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Cập nhật thông tin cá nhân của người dùng.
   */
  async updateUser(userId, userData) {
    const { full_name, phone } = userData;
    const query = `
      UPDATE users
      SET full_name = COALESCE($1, full_name),
          phone = COALESCE($2, phone),
          updated_at = NOW()
      WHERE id = $3
      RETURNING id, email, full_name, phone, role, is_active, email_verified, created_at, updated_at
    `;
    const result = await pool.query(query, [full_name, phone, userId]);
    return result.rows[0];
  }

  /**
   * Vô hiệu hóa một người dùng (soft delete).
   */
  async deleteUser(userId) {
    const query = 'UPDATE users SET is_active = false WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [userId]);
    return result.rowCount;
  }

  /**
   * Lấy danh sách người dùng và đếm tổng số lượng với các điều kiện lọc.
   * Hàm này gộp cả findAll và countAll để tối ưu hóa.
   */
  async findAllAndCount(options) {
    const { limit = 10, offset = 0, filters = {} } = options;

    let baseQuery = 'FROM users WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    // Áp dụng bộ lọc
    if (filters.role) {
      baseQuery += ` AND role = $${paramIndex++}`;
      queryParams.push(filters.role);
    }
    if (filters.isActive !== undefined) {
      baseQuery += ` AND is_active = $${paramIndex++}`;
      queryParams.push(filters.isActive);
    }

    // Câu lệnh đếm
    const countQuery = `SELECT COUNT(*) ${baseQuery}`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].count, 10);

    const dataQuery = `
      SELECT id, email, full_name, phone, role, is_active
      ${baseQuery} 
      ORDER BY id ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    const dataResult = await pool.query(dataQuery, [...queryParams, limit, offset]);

    return {
      users: dataResult.rows,
      totalItems,
    };
  }
}

module.exports = new UserRepository();