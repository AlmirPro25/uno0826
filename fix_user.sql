DELETE FROM users WHERE email='almirroj@gmail.com' OR username='almirroj@gmail.com' OR username='Almir';
INSERT INTO users (id, email, username, password_hash, role, roles, status, created_at, updated_at) 
VALUES ('848126ee-411f-4646-b97f-1cd3ae4f920d', 'almirroj@gmail.com', 'almirroj@gmail.com', '$2a$10$jCJWvDUCw.E9GoiLnZXvlePHGULoLaGqNH6eRsfi..9fWZz/vha02', 'super_admin', 'super_admin,admin,user', 'active', datetime('now'), datetime('now'));

DELETE FROM user_profiles WHERE email='almirroj@gmail.com';
INSERT INTO user_profiles (id, user_id, name, email, created_at, updated_at) 
VALUES ('a48126ee-411f-4646-b97f-1cd3ae4f920e', '848126ee-411f-4646-b97f-1cd3ae4f920d', 'Almir', 'almirroj@gmail.com', datetime('now'), datetime('now'));
