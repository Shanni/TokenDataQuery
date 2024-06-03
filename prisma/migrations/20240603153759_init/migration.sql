-- CreateTable
CREATE TABLE "tokens" (
    "tokenAddress" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "totalSupply" INTEGER NOT NULL,
    "volumeUSD" DOUBLE PRECISION NOT NULL,
    "decimals" INTEGER NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("tokenAddress")
);

-- CreateTable
CREATE TABLE "tokens_price_data" (
    "id" SERIAL NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "periodStartUnix" INTEGER NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "priceUSD" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "tokens_price_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_tokenAddress_key" ON "tokens"("tokenAddress");

-- CreateIndex
CREATE INDEX "token_period_start_unix" ON "tokens_price_data"("tokenAddress", "periodStartUnix");

-- AddForeignKey
ALTER TABLE "tokens_price_data" ADD CONSTRAINT "tokens_price_data_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "tokens"("tokenAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
