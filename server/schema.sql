-- Import this file into your chosen database (e.g., eb_habit_tracker)

-- 1. users
CREATE TABLE IF NOT EXISTS users (
    id INT(4) UNSIGNED ZEROFILL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    full_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    avatar_url LONGTEXT,
    provider VARCHAR(20) DEFAULT 'email',
    reset_token VARCHAR(64) NULL,
    reset_token_expires DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. user_habits
CREATE TABLE IF NOT EXISTS user_habits (
    id CHAR(36) PRIMARY KEY,
    user_id INT(4) UNSIGNED ZEROFILL,
    name VARCHAR(100),
    goals VARCHAR(255),
    description TEXT,
    category VARCHAR(50),
    icon_html VARCHAR(255),
    evaluation VARCHAR(20),
    unit VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. habit_logs
CREATE TABLE IF NOT EXISTS habit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT(4) UNSIGNED ZEROFILL,
    habit_id CHAR(36),
    log_date DATE,
    completed BOOLEAN DEFAULT FALSE,
    numeric_value INT DEFAULT 0,
    timer_elapsed INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (habit_id) REFERENCES user_habits(id) ON DELETE CASCADE,
    UNIQUE(habit_id, log_date)
);

-- 4. user_experience
CREATE TABLE IF NOT EXISTS user_experience (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT(4) UNSIGNED ZEROFILL,
    rating TINYINT,
    comment TEXT,
    source VARCHAR(50),
    app_version VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. ux_metrics
CREATE TABLE IF NOT EXISTS ux_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT(4) UNSIGNED ZEROFILL,
    metric_type VARCHAR(50),
    metric_value VARCHAR(255),
    page_name VARCHAR(100),
    session_id CHAR(36),
    device_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. ux_sessions
CREATE TABLE IF NOT EXISTS ux_sessions (
    id CHAR(36) PRIMARY KEY,
    user_id INT(4) UNSIGNED ZEROFILL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    pages_visited INT DEFAULT 0,
    total_duration INT DEFAULT 0,
    device_type VARCHAR(20),
    browser VARCHAR(50),
    screen_resolution VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

