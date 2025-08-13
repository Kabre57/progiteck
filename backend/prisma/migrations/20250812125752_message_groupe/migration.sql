-- CreateTable
CREATE TABLE "Groupe" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "Groupe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageGroupe" (
    "id" SERIAL NOT NULL,
    "contenu" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "groupeId" INTEGER NOT NULL,
    "attachments" JSONB,

    CONSTRAINT "MessageGroupe_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MessageGroupe" ADD CONSTRAINT "MessageGroupe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageGroupe" ADD CONSTRAINT "MessageGroupe_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "Groupe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
