CREATE TABLE IF NOT EXISTS BUSINESSES (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    business_name VARCHAR (255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ACCOUNTS (
    id SERIAL PRIMARY KEY,
    business_id INT NOT NULL,
    account_number BIGINT UNIQUE NOT NULL,
    ifsc_code CHAR(8) NOT NULL,
    activation_status VARCHAR(8) CHECK (activation_status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
    transaction_allowed VARCHAR(6) CHECK (transaction_allowed IN ('CREDIT', 'DEBIT', 'BOTH')) DEFAULT 'BOTH',
    daily_withdrawal_limit DECIMAL(15, 2) DEFAULT 100000.00,
    balance DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES BUSINESSES(id)
);

CREATE TABLE IF NOT EXISTS TRANSACTIONS (
    id SERIAL PRIMARY KEY,
    account_id INT NOT NULL,
    transaction_type VARCHAR CHECK (transaction_type IN ('DEPOSIT', 'WITHDRAWL')) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    sender_account_number BIGINT NOT NULL,
    receiver_account_number BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES ACCOUNTS(id)
);