-- 03_SEED_BOOKINGS.sql
-- Seed data for Bookings and Booking Items

USE cms_db;

/* ---- CMS_BOOKING ---- */
-- We have day slots for today (1:Breakfast, 2:Lunch, 3:Evening)
-- Customers:
-- 1 - Admin (Permanent)
-- 2 - Mahesh (Permanent)
-- 3 - Priya (Permanent)
-- 4 - Contract Worker (Contract)

INSERT INTO CMS_BOOKING (BOOKNO, CANTEENID, BOOKTYPECODE, CUSTOMERID, SERVICEID, SERVICEDATE, STATUS, BOOKEDBY) VALUES
('PB-2026-0001', 1, 'PB', 2, 2, CURRENT_DATE, 'CR', 5), -- Mahesh booked Breakfast for today
('PB-2026-0002', 1, 'PB', 2, 4, CURRENT_DATE, 'CR', 5), -- Mahesh booked Lunch for today
('KS-2026-0003', 1, 'KS', 4, 2, CURRENT_DATE, 'CR', 4), -- Contract Worker kiosk booking Breakfast
('PB-2026-0004', 1, 'PB', 3, 4, DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), 'CR', 7); -- Priya booked Lunch for tomorrow

/* ---- CMS_BOOKITEM ---- */
-- BOOKID 1: Breakfast (DAYMENUID 1)
INSERT INTO CMS_BOOKITEM (BOOKINGID, DAYMENUID, QTY, ITEMPRICE, TOTALAMT, STATUS) VALUES
(1, 1, 1, 15.00, 15.00, 'SRV'); -- Already served (simulating past time)

-- BOOKID 2: Lunch (DAYMENUID 2 and 3)
INSERT INTO CMS_BOOKITEM (BOOKINGID, DAYMENUID, QTY, ITEMPRICE, TOTALAMT, STATUS) VALUES
(2, 2, 1, 40.00, 40.00, 'CR'),
(2, 3, 2, 35.00, 70.00, 'CR');

-- BOOKID 3: Breakfast Kiosk (DAYMENUID 1)
INSERT INTO CMS_BOOKITEM (BOOKINGID, DAYMENUID, QTY, ITEMPRICE, TOTALAMT, STATUS) VALUES
(3, 1, 1, 25.00, 25.00, 'CAN'); -- Cancelled Kiosk booking

-- BOOKID 4: Tomorrow Lunch (DAYMENUID 6)
INSERT INTO CMS_BOOKITEM (BOOKINGID, DAYMENUID, QTY, ITEMPRICE, TOTALAMT, STATUS) VALUES
(4, 6, 1, 40.00, 40.00, 'CR');

/* ---- Update booking totals based on items ---- */
UPDATE CMS_BOOKING
SET TOTALAMT = 15.00, STATUS = 'SRV'
WHERE BOOKINGID = 1;

UPDATE CMS_BOOKING
SET TOTALAMT = 110.00
WHERE BOOKINGID = 2;

UPDATE CMS_BOOKING
SET TOTALAMT = 25.00, STATUS = 'CAN'
WHERE BOOKINGID = 3;

UPDATE CMS_BOOKING
SET TOTALAMT = 40.00
WHERE BOOKINGID = 4;

/* ---- CMS_BOOKCTR ---- */
INSERT INTO CMS_BOOKCTR (BTYPECODE, SERVICEID, YEARMONTH, LASTNO) VALUES
('PB', 2, DATE_FORMAT(CURRENT_DATE, '%Y%m'), 1),
('PB', 4, DATE_FORMAT(CURRENT_DATE, '%Y%m'), 2),
('KS', 2, DATE_FORMAT(CURRENT_DATE, '%Y%m'), 1);
