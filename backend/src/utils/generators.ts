import { prisma } from '@/config/database';


export async function generateMissionNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // Générer une partie aléatoire pour garantir l'unicité
  const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `INT-${year}${month}${day}-${randomPart}`;
}

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