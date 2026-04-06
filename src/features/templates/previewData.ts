import { ContractType, type CounterGuaranteeData } from '../../types';

export function getTemplatePreviewData(type: ContractType): CounterGuaranteeData {
  return {
    type,
    contractDate: '2026-04-06',
    createdAt: '2026-04-06T12:00:00.000Z',
    principal: {
      name: 'Maria Fernanda Lopez',
      age: '42',
      maritalStatus: 'casada',
      profession: 'comerciante',
      domicile: 'Ciudad de Guatemala',
      idNumber: '1234 56789 0101',
      cui: '1234567890101',
      isRepresenting: true,
      role: 'Administradora Unica',
      entityName: 'Inversiones La Ceiba, S.A.',
      notaryName: 'Lic. Carlos Mendez',
      actDate: '15 de marzo de 2026',
      regNumber: '812345',
      regFolio: '201',
      regBook: '455',
    },
    guarantors: [
      {
        name: 'Juan Estuardo Perez',
        age: '51',
        maritalStatus: 'casado',
        profession: 'empresario',
        domicile: 'Mixco, Guatemala',
        idNumber: '5678 12345 0101',
        cui: '5678123450101',
        isRepresenting: false,
      },
    ],
    policies: [
      {
        number: 'POL-2026-0041',
        type: 'Cumplimiento',
        amount: 250000,
        amountInWords: 'Doscientos cincuenta mil quetzales exactos',
      },
      {
        number: 'POL-2026-0188',
        type: 'Conservacion de obra',
        amount: 125000,
        amountInWords: 'Ciento veinticinco mil quetzales exactos',
      },
    ],
    notificationAddress: '12 avenida 18-45, zona 10, Ciudad de Guatemala',
    beneficiaryName: 'Banco de Desarrollo Regional, S.A.',
    signatureNames: ['Maria Fernanda Lopez', 'Juan Estuardo Perez'],
  };
}
