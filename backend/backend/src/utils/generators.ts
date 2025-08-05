import { prisma } from '@/config/database';

export const generateMissionNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `INT-${year}-`;
  
  // Trouver le dernier numéro pour cette année
  const lastMission = await prisma.mission.findFirst({
    where: {
      numIntervention: {
        startsWith: prefix
      }
    },
    orderBy: {
      numIntervention: 'desc'
    }
  });

  let nextNumber = 1;
  if (lastMission) {
    const lastNumber = parseInt(lastMission.numIntervention.split('-')[2] || '0');
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
};

export const generateDevisNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `DEV-${year}-`;
  
  const lastDevis = await prisma.devis.findFirst({
    where: {
      numero: {
        startsWith: prefix
      }
    },
    orderBy: {
      numero: 'desc'
    }
  });

  let nextNumber = 1;
  if (lastDevis) {
    const lastNumber = parseInt(lastDevis.numero.split('-')[2] || '0');
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
};

export const generateFactureNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `FAC-${year}-`;
  
  const lastFacture = await prisma.facture.findFirst({
    where: {
      numero: {
        startsWith: prefix
      }
    },
    orderBy: {
      numero: 'desc'
    }
  });

  let nextNumber = 1;
  if (lastFacture) {
    const lastNumber = parseInt(lastFacture.numero.split('-')[2] || '0');
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
};