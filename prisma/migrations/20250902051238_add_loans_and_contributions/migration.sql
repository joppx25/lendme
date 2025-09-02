-- CreateTable
CREATE TABLE `loans` (
    `id` VARCHAR(191) NOT NULL,
    `loan_number` VARCHAR(191) NOT NULL,
    `borrower_id` VARCHAR(191) NOT NULL,
    `approver_id` VARCHAR(191) NULL,
    `loan_type` ENUM('PERSONAL', 'BUSINESS', 'EMERGENCY', 'EDUCATION', 'MEDICAL', 'AGRICULTURE') NOT NULL,
    `principal_amount` DECIMAL(15, 2) NOT NULL,
    `interest_rate` DECIMAL(5, 2) NOT NULL,
    `term_months` INTEGER NOT NULL,
    `monthly_payment` DECIMAL(15, 2) NOT NULL,
    `total_amount` DECIMAL(15, 2) NOT NULL,
    `remaining_balance` DECIMAL(15, 2) NOT NULL,
    `status` ENUM('PENDING', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'COMPLETED', 'OVERDUE', 'DEFAULTED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `purpose` VARCHAR(191) NOT NULL,
    `collateral` VARCHAR(191) NULL,
    `start_date` DATETIME(3) NULL,
    `end_date` DATETIME(3) NULL,
    `requested_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approved_at` DATETIME(3) NULL,
    `rejected_at` DATETIME(3) NULL,
    `rejection_reason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `loans_loan_number_key`(`loan_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loan_payments` (
    `id` VARCHAR(191) NOT NULL,
    `loan_id` VARCHAR(191) NOT NULL,
    `payer_id` VARCHAR(191) NOT NULL,
    `payment_number` INTEGER NOT NULL,
    `scheduled_amount` DECIMAL(15, 2) NOT NULL,
    `paid_amount` DECIMAL(15, 2) NOT NULL,
    `principal_paid` DECIMAL(15, 2) NOT NULL,
    `interest_paid` DECIMAL(15, 2) NOT NULL,
    `late_fee` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `scheduled_date` DATETIME(3) NOT NULL,
    `paid_date` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'PAID', 'LATE', 'PARTIAL', 'MISSED') NOT NULL DEFAULT 'PENDING',
    `payment_method` ENUM('CASH', 'BANK_TRANSFER', 'GCASH', 'PAYMAYA', 'CHECK', 'ONLINE_BANKING') NULL,
    `receipt_number` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `loan_payments_loan_id_payment_number_key`(`loan_id`, `payment_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contributions` (
    `id` VARCHAR(191) NOT NULL,
    `contributor_id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `contribution_type` ENUM('INITIAL_CAPITAL', 'MONTHLY_SAVINGS', 'VOLUNTARY', 'PROFIT_SHARING', 'SPECIAL_ASSESSMENT') NOT NULL,
    `payment_method` ENUM('CASH', 'BANK_TRANSFER', 'GCASH', 'PAYMAYA', 'CHECK', 'ONLINE_BANKING') NOT NULL,
    `receipt_number` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING') NOT NULL DEFAULT 'PENDING',
    `contributed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processed_at` DATETIME(3) NULL,
    `processed_by` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fund_balance` (
    `id` VARCHAR(191) NOT NULL,
    `total_funds` DECIMAL(15, 2) NOT NULL,
    `available_funds` DECIMAL(15, 2) NOT NULL,
    `loaned_funds` DECIMAL(15, 2) NOT NULL,
    `total_contributions` DECIMAL(15, 2) NOT NULL,
    `total_repayments` DECIMAL(15, 2) NOT NULL,
    `last_updated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `loans` ADD CONSTRAINT `loans_borrower_id_fkey` FOREIGN KEY (`borrower_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loans` ADD CONSTRAINT `loans_approver_id_fkey` FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_payments` ADD CONSTRAINT `loan_payments_loan_id_fkey` FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_payments` ADD CONSTRAINT `loan_payments_payer_id_fkey` FOREIGN KEY (`payer_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contributions` ADD CONSTRAINT `contributions_contributor_id_fkey` FOREIGN KEY (`contributor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
