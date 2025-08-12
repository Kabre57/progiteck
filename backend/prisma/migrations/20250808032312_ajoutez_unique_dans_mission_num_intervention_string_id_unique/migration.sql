/*
  Warnings:

  - A unique constraint covering the columns `[numIntervention]` on the table `missions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "missions_numIntervention_key" ON "missions"("numIntervention");
