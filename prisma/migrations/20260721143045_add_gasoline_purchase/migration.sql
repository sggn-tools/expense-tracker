-- CreateTable
CREATE TABLE `gasoline_purchases` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `merchant` VARCHAR(191) NOT NULL,
    `paymentType` VARCHAR(191) NOT NULL,
    `purchasedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `gasoline_purchases_userId_idx`(`userId`),
    INDEX `gasoline_purchases_merchant_idx`(`merchant`),
    INDEX `gasoline_purchases_purchasedAt_idx`(`purchasedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `gasoline_purchases` ADD CONSTRAINT `gasoline_purchases_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
