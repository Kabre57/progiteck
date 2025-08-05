-- AddForeignKey
ALTER TABLE "devis" ADD CONSTRAINT "devis_validePar_fkey" FOREIGN KEY ("validePar") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devis" ADD CONSTRAINT "devis_valideParPDG_fkey" FOREIGN KEY ("valideParPDG") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
