-- CreateTable
CREATE TABLE "panelin_services" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rate" INTEGER NOT NULL,
    "min" INTEGER NOT NULL,
    "max" INTEGER NOT NULL,
    "dripfeed" BOOLEAN NOT NULL,
    "refill" BOOLEAN NOT NULL,
    "cancel" BOOLEAN NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "panelin_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "panelin_orders" (
    "id" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "link" TEXT,
    "quantity" INTEGER NOT NULL,
    "rate" INTEGER NOT NULL,
    "charge" INTEGER NOT NULL,
    "startCount" INTEGER,
    "remains" INTEGER,
    "status" TEXT NOT NULL,
    "comments" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "panelin_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "panelin_transactions" (
    "id" INTEGER NOT NULL,
    "type" TEXT,
    "amount" INTEGER NOT NULL,
    "balanceBefore" INTEGER,
    "balanceAfter" INTEGER,
    "description" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "panelin_transactions_pkey" PRIMARY KEY ("id")
);
