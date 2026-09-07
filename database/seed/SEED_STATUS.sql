-- ==============================================================================
-- CLEAR EXISTING DATA
-- ==============================================================================
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE CMS_STATUS; 
SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- SEED DATA: CMS_STATUS via Stored Procedure
-- ==============================================================================

-- System State (10-19)
CALL CMSADDSTATUS(10, 'ACT', 'Active', 'SYS', 'System object is active and available');
CALL CMSADDSTATUS(11, 'DIS', 'Disabled', 'SYS', 'System object is disabled');

-- Menu Approval Workflow (20-29)
CALL CMSADDSTATUS(20, 'DRF', 'Draft', 'MENU_APPR', 'Menu is being prepared');
CALL CMSADDSTATUS(21, 'PEN', 'Pending Approval', 'MENU_APPR', 'Submitted to manager');
CALL CMSADDSTATUS(22, 'APR', 'Approved', 'MENU_APPR', 'Menu is finalized');
CALL CMSADDSTATUS(23, 'REJ', 'Rejected', 'MENU_APPR', 'Sent back for changes');

-- Booking Lifecycle (30-39)
CALL CMSADDSTATUS(30, 'CRT', 'Created', 'BOOKING', 'Booking confirmed');
CALL CMSADDSTATUS(32, 'SRV', 'Served', 'BOOKING', 'Item delivered to customer');
CALL CMSADDSTATUS(33, 'CAN', 'Cancelled', 'BOOKING', 'Cancelled by customer or admin');
CALL CMSADDSTATUS(34, 'NOS', 'No Show', 'BOOKING', 'Time elapsed without claiming');

-- Wallet Transactions (40-49)
CALL CMSADDSTATUS(40, 'DEP', 'Deposit', 'WALLET_TXN', 'Funds added to wallet');
CALL CMSADDSTATUS(41, 'WTH', 'Withdrawal', 'WALLET_TXN', 'Funds withdrawn/refunded to user');
CALL CMSADDSTATUS(42, 'HLD', 'Hold', 'WALLET_TXN', 'Funds locked for advance booking');
CALL CMSADDSTATUS(43, 'REL', 'Release', 'WALLET_TXN', 'Funds unlocked due to cancellation');
CALL CMSADDSTATUS(44, 'DBT', 'Debit', 'WALLET_TXN', 'Funds permanently deducted for served meal or no-show');

-- Wallet Withdraw Requests (50-59)
CALL CMSADDSTATUS(50, 'REQ', 'Requested', 'WITHDRAW_REQ', 'Withdrawal requested by user');
CALL CMSADDSTATUS(51, 'COM', 'Completed', 'WITHDRAW_REQ', 'Withdrawal processed and completed');
CALL CMSADDSTATUS(52, 'REJ', 'Rejected', 'WITHDRAW_REQ', 'Withdrawal request rejected');