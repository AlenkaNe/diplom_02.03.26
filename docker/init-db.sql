-- Инициализация схемы для первого запуска PostgreSQL в Docker.
-- Порядок таблиц согласован с внешними ключами.

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    login VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    gender VARCHAR(50),
    age INTEGER CHECK (age >= 1 AND age <= 120),
    height_cm INTEGER CHECK (height_cm >= 50 AND height_cm <= 250),
    weight DECIMAL(5,2) CHECK (weight >= 20 AND weight <= 500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_users_login ON users(login);

CREATE TABLE meal_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

INSERT INTO meal_types (name) VALUES
    ('Завтрак'),
    ('Обед'),
    ('Ужин'),
    ('Перекус');

CREATE TABLE foods (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    kcal_per_100 DECIMAL(8,2),
    protein_g DECIMAL(8,2),
    fat_g DECIMAL(8,2),
    carbs_g DECIMAL(8,2)
);

CREATE INDEX idx_foods_name ON foods(name);

CREATE TABLE user_metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    goal VARCHAR(50),
    activity_level VARCHAR(100),
    daily_kcal_norm INTEGER,
    body_mass_index DECIMAL(4,1),
    daily_protein DECIMAL(6,2),
    daily_fat DECIMAL(6,2),
    daily_carbs DECIMAL(6,2),
    CONSTRAINT fk_user_metrics_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_user_metrics_user_id ON user_metrics(user_id);

CREATE TABLE diary_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    meal_type_id INTEGER NOT NULL,
    food_id INTEGER,
    amount_gram DECIMAL(8,2) NOT NULL CHECK (amount_gram > 0),
    custom_name VARCHAR(255) NOT NULL,
    custom_kcal DECIMAL(8,2),
    custom_protein DECIMAL(8,2),
    custom_fat DECIMAL(8,2),
    custom_carbs DECIMAL(8,2),
    eaten_at DATE NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_diary_entries_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_diary_entries_meal_type
        FOREIGN KEY (meal_type_id)
        REFERENCES meal_types(id),
    CONSTRAINT fk_diary_entries_food
        FOREIGN KEY (food_id)
        REFERENCES foods(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_diary_entries_user_id ON diary_entries(user_id);
CREATE INDEX idx_diary_entries_meal_type_id ON diary_entries(meal_type_id);
CREATE INDEX idx_diary_entries_eaten_at ON diary_entries(eaten_at);
CREATE INDEX idx_diary_entries_user_date ON diary_entries(user_id, eaten_at);

CREATE TABLE IF NOT EXISTS recipes (
    id            BIGSERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    image_url     TEXT,
    ingredients   TEXT,
    instructions  TEXT,
    kcal_per_100  DOUBLE PRECISION CHECK (kcal_per_100 >= 0),
    protein_g     DOUBLE PRECISION CHECK (protein_g >= 0),
    fat_g         DOUBLE PRECISION CHECK (fat_g >= 0),
    carbs_g       DOUBLE PRECISION CHECK (carbs_g >= 0),
    time_minutes  INTEGER CHECK (time_minutes >= 0),
    servings      INTEGER CHECK (servings >= 1),
    category      TEXT NOT NULL
);

CREATE TABLE user_recipes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    kcal_per_100 DECIMAL(8,2),
    protein_g DECIMAL(8,2),
    fat_g DECIMAL(8,2),
    carbs_g DECIMAL(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_recipes_user_id ON user_recipes(user_id);
