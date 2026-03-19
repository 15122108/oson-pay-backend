const db = require('../config/database');

async function runMigrations() {
  console.log('🔄 Running migrations...');

  try {
    // Users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone VARCHAR(20) UNIQUE NOT NULL,
        full_name VARCHAR(100),
        pin_hash VARCHAR(255),
        is_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        avatar_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ users table');

    // OTP table
    await db.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ otps table');

    // Cards table
    await db.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        card_number VARCHAR(16) NOT NULL,
        card_holder VARCHAR(100) NOT NULL,
        expiry_month VARCHAR(2) NOT NULL,
        expiry_year VARCHAR(4) NOT NULL,
        card_type VARCHAR(20) DEFAULT 'uzcard',
        balance DECIMAL(15,2) DEFAULT 0.00,
        is_default BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        color_from VARCHAR(20) DEFAULT '#6C63FF',
        color_to VARCHAR(20) DEFAULT '#9B59FF',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ cards table');

    // Wallets table (main balance)
    await db.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        balance DECIMAL(15,2) DEFAULT 0.00,
        currency VARCHAR(3) DEFAULT 'UZS',
        is_frozen BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ wallets table');

    // Transactions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID REFERENCES users(id),
        receiver_id UUID REFERENCES users(id),
        sender_card_id UUID REFERENCES cards(id),
        receiver_card_id UUID REFERENCES cards(id),
        amount DECIMAL(15,2) NOT NULL,
        fee DECIMAL(15,2) DEFAULT 0.00,
        type VARCHAR(20) NOT NULL CHECK (type IN ('send','receive','payment','topup','withdraw')),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','cancelled')),
        description TEXT,
        category VARCHAR(50),
        reference VARCHAR(50) UNIQUE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      );
    `);
    console.log('✅ transactions table');

    // Contacts (saved contacts)
    await db.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        contact_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        nickname VARCHAR(100),
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, contact_user_id)
      );
    `);
    console.log('✅ contacts table');

    // Notifications
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        body TEXT NOT NULL,
        type VARCHAR(50),
        is_read BOOLEAN DEFAULT FALSE,
        data JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ notifications table');

    // Sessions (refresh tokens)
    await db.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) NOT NULL,
        device_info VARCHAR(255),
        ip_address VARCHAR(50),
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ sessions table');

    // Indexes for performance
    await db.query(`CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON transactions(receiver_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_cards_user ON cards(user_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone);`);
    console.log('✅ Indexes created');

    console.log('\n🎉 All migrations completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  }
}

runMigrations()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
