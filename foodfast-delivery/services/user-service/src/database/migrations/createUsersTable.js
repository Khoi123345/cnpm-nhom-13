const pool = require('../../config/database');

const createUsersTable = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running migration: Create users table...');
    
    // Nối chuỗi SQL lại để đảm bảo không có ký tự lỗi
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        phone VARCHAR(20),
        role VARCHAR(20) CHECK (role IN ('CUSTOMER', 'RESTAURANT', 'ADMIN')) DEFAULT 'CUSTOMER',
        
        -- CỘT MỚI ĐÃ THÊM --
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BANNED')),

        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createIndexesQuery = `
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
    `;

    const createFunctionQuery = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;
    
    const createTriggerQuery = `
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `;

    // Thực thi từng câu lệnh một
    await client.query(createTableQuery);
    await client.query(createIndexesQuery);
    await client.query(createFunctionQuery);
    await client.query(createTriggerQuery);

    console.log('✅ Migration completed: users table created/updated');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  createUsersTable()
    .then(() => {
      console.log('✅ All migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration error:', error);
      process.exit(1);
    });
}

module.exports = createUsersTable;