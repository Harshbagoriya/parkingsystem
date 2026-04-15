-- ================================================================
-- ParkSmart — MySQL Schema
-- Run this once to set up reporting / analytics tables
-- ================================================================

CREATE DATABASE IF NOT EXISTS parksmart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE parksmart;

-- ── Parking Sessions (entry/exit analytics) ──────────────────
CREATE TABLE IF NOT EXISTS parking_sessions (
  id             INT          AUTO_INCREMENT PRIMARY KEY,
  bookingId      VARCHAR(20)  NOT NULL,
  vehicleNumber  VARCHAR(20)  NOT NULL,
  slotId         VARCHAR(10)  NOT NULL,
  zone           VARCHAR(50),
  category       VARCHAR(30),
  userId         VARCHAR(50),
  entryTime      DATETIME,
  exitTime       DATETIME,
  durationMin    INT,
  status         ENUM('active','completed','cancelled') DEFAULT 'active',
  createdAt      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updatedAt      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vehicle  (vehicleNumber),
  INDEX idx_slot     (slotId),
  INDEX idx_status   (status),
  INDEX idx_entry    (entryTime)
);

-- ── Slot Audit Log ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS slot_logs (
  id          INT          AUTO_INCREMENT PRIMARY KEY,
  slotId      VARCHAR(10)  NOT NULL,
  fromStatus  VARCHAR(20),
  toStatus    VARCHAR(20),
  changedBy   VARCHAR(50),
  reason      VARCHAR(100),
  createdAt   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slot (slotId)
);

-- ── Useful Views ──────────────────────────────────────────────

-- Daily occupancy summary
CREATE OR REPLACE VIEW daily_occupancy AS
SELECT
  DATE(entryTime)     AS date,
  COUNT(*)            AS totalEntries,
  COUNT(exitTime)     AS completedSessions,
  AVG(durationMin)    AS avgDurationMin,
  zone,
  category
FROM parking_sessions
WHERE entryTime IS NOT NULL
GROUP BY DATE(entryTime), zone, category
ORDER BY date DESC;

-- Peak hour analysis
CREATE OR REPLACE VIEW peak_hours AS
SELECT
  HOUR(entryTime)     AS hour,
  COUNT(*)            AS entryCount
FROM parking_sessions
WHERE entryTime IS NOT NULL
GROUP BY HOUR(entryTime)
ORDER BY entryCount DESC;

-- Currently active sessions
CREATE OR REPLACE VIEW active_sessions AS
SELECT
  vehicleNumber, slotId, zone, category,
  entryTime,
  TIMESTAMPDIFF(MINUTE, entryTime, NOW()) AS minutesParked
FROM parking_sessions
WHERE status = 'active'
ORDER BY entryTime;

-- Sample insert for testing 
INSERT IGNORE INTO parking_sessions
  (bookingId, vehicleNumber, slotId, zone, category, userId, entryTime, exitTime, durationMin, status)
VALUES
  ('BK0001','RJ14 AB 1234','B-07','Student Car','student_car','user1','2024-01-20 09:42:00',NULL,NULL,'active'),
  ('BK0002','MH12 EF 9012','A-03','Student Bike','student_bike','user2','2024-01-20 08:30:00','2024-01-20 10:15:00',105,'completed'),
  ('BK0003','DL01 XY 7890','C-11','Faculty','faculty','user3','2024-01-20 09:15:00',NULL,NULL,'active');
