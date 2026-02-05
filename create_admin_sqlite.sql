INSERT OR IGNORE INTO users (id, email, username, password_hash, role, roles, status, created_at, updated_at) 
VALUES (
    '848126ee-411f-4646-b97f-1cd3ae4f920d', 
    'almirroj@gmail.com', 
    'Almir', 
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 
    'super_admin', 
    'super_admin,admin,user', 
    'active', 
    datetime('now'), 
    datetime('now')
);

INSERT OR IGNORE INTO user_profiles (id, user_id, name, email, created_at, updated_at)
VALUES (
    'a48126ee-411f-4646-b97f-1cd3ae4f920e',
    '848126ee-411f-4646-b97f-1cd3ae4f920d',
    'Almir',
    'almirroj@gmail.com',
    datetime('now'),
    datetime('now')
);
