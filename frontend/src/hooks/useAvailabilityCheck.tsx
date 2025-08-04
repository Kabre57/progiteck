import { useState, useRef } from 'react';
import { interventionService } from '@/services/interventionService';

import { AvailabilityResult } from '@/types';

export const useAvailabilityCheck = () => {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<AvailabilityResult[]>([]);
  
  // ✅ CORRECTION : Prévention des appels multiples simultanés
  const checkingRef = useRef(false);

  const checkSingle = async (technicienId: number, dateDebut: string, dateFin: string) => {
    // Prévenir les appels multiples simultanés
    if (checkingRef.current) {
      console.log('Vérification déjà en cours, ignoré');
      return;
    }

    setChecking(true);
    checkingRef.current = true;
    
    try {
      console.log(`Vérification simple pour technicien ${technicienId}`);
      const result = await interventionService.checkAvailability({
        technicienId,
        dateHeureDebut: dateDebut,
        dateHeureFin: dateFin
      });
      return result.data;
    } catch (error) {
      console.error('Erreur vérification disponibilité:', error);
      throw error;
    } finally {
      setChecking(false);
      checkingRef.current = false;
    }
  };

  const checkMultiple = async (technicienIds: number[], dateDebut: string, dateFin: string) => {
    // Prévenir les appels multiples simultanés
    if (checkingRef.current) {
      console.log('Vérification multiple déjà en cours, ignoré');
      return results; // Retourner les résultats existants
    }

    // ✅ CORRECTION : Déduplication des IDs avant l'appel
    const uniqueIds = [...new Set(technicienIds)];
    console.log('IDs originaux:', technicienIds);
    console.log('IDs dédupliqués:', uniqueIds);

    if (uniqueIds.length === 0) {
      console.log('Aucun technicien à vérifier');
      return [];
    }

    setChecking(true);
    checkingRef.current = true;
    
    try {
      console.log(`Vérification multiple pour ${uniqueIds.length} technicien(s):`, uniqueIds);
      const results = await interventionService.checkMultipleAvailability(
        uniqueIds,
        dateDebut,
        dateFin
      );
      
      console.log('Résultats de vérification multiple:', results);
      setResults(results);
      return results;
    } catch (error) {
      console.error('Erreur vérification multiple:', error);
      throw error;
    } finally {
      setChecking(false);
      checkingRef.current = false;
    }
  };

  return {
    checking,
    results,
    checkSingle,
    checkMultiple
  };
};