CREATE TABLE IF NOT EXISTS BUSINESSES (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    business_name VARCHAR (255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activation_status') THEN
        CREATE TYPE activation_status AS ENUM ('ACTIVE', 'INACTIVE');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_allowed') THEN
        CREATE TYPE transaction_allowed AS ENUM ('CREDIT', 'DEBIT', 'BOTH');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS ACCOUNTS (
    id SERIAL PRIMARY KEY,
    business_id INT NOT NULL,
    account_number BIGINT UNIQUE NOT NULL,
    ifsc_code CHAR(8) NOT NULL,
    activation_status activation_status DEFAULT 'ACTIVE',
    transaction_allowed transaction_allowed DEFAULT 'BOTH',
    daily_withdrawal_limit DECIMAL(15, 2) DEFAULT 100000.00,
    balance DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES BUSINESSES(id)
);