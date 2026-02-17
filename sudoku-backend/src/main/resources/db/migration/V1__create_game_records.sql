CREATE TABLE game_records (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    difficulty INT NOT NULL,
    elapsed_time BIGINT NOT NULL,
    life INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 유저별 기록 조회를 빠르게 하기 위한 인덱스
CREATE INDEX idx_game_records_email ON game_records(email);