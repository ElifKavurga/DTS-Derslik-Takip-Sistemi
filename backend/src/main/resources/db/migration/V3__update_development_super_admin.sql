UPDATE users
SET
    first_name = 'Süper',
    last_name = 'Admin',
    email = 'admin@inonu.edu.tr',
    password = '$2a$10$X2IdP8ej1.iiBsgG51RtiugYnKr8leIds.rQSNm0DeBxL7JAtP/Hq',
    role = 'SUPER_ADMIN',
    active = TRUE,
    updated_at = CURRENT_TIMESTAMP
WHERE id = '11111111-1111-1111-1111-111111111111';
