import { ContractType, type CounterGuaranteeData } from '../../types';

const basePreviewData: Omit<CounterGuaranteeData, 'type'> = {
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
    isRepresenting: false,
  },
  guarantors: [],
  policies: [
    {
      number: 'POL-2026-0041',
      type: 'Cumplimiento',
      amount: 250000,
      amountInWords: 'Doscientos cincuenta mil quetzales exactos',
    },
  ],
  notificationAddress: '12 avenida 18-45, zona 10, Ciudad de Guatemala',
  beneficiaryName: 'Banco de Desarrollo Regional, S.A.',
  signatureNames: ['Maria Fernanda Lopez'],
};

const entityPrincipal = {
  ...basePreviewData.principal,
  isRepresenting: true,
  role: 'Administradora Unica',
  entityName: 'Inversiones La Ceiba, S.A.',
  notaryName: 'Lic. Carlos Mendez',
  actDate: '2026-03-15',
  regNumber: '812345',
  regFolio: '201',
  regBook: '455',
};

const withGuarantor = {
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
  signatureNames: ['Maria Fernanda Lopez', 'Juan Estuardo Perez'],
};

export function getTemplatePreviewData(type: ContractType): CounterGuaranteeData {
  switch (type) {
    case ContractType.COUNTER_GUARANTEE_PRIVATE:
      return { ...basePreviewData, type, ...withGuarantor };

    case ContractType.COUNTER_GUARANTEE_PRIVATE_ENTITY:
      return { ...basePreviewData, type, principal: entityPrincipal, ...withGuarantor };

    case ContractType.COUNTER_GUARANTEE_PUBLIC:
      return { ...basePreviewData, type, principal: entityPrincipal, ...withGuarantor };

    case ContractType.COUNTER_GUARANTEE_MULTIPLE:
      return {
        ...basePreviewData, type,
        principal: entityPrincipal,
        policies: [],
        maxGuaranteeAmount: 500000,
        maxGuaranteeAmountInWords: 'Quinientos mil quetzales',
      };

    case ContractType.MOVABLE_GUARANTEE:
      return {
        ...basePreviewData, type,
        principal: entityPrincipal,
        ...withGuarantor,
        movableAssetsData: {
          assetsDescription: 'Maquinaria industrial marca XYZ, modelo 2024, serie AB-12345',
          assetsValue: 'Q. 150,000.00',
          assetsValueInWords: 'Ciento cincuenta mil quetzales',
          assetsLocation: 'Bodega Industrial zona 12, Ciudad de Guatemala',
        },
      };

    case ContractType.MORTGAGE_GUARANTEE:
      return {
        ...basePreviewData, type,
        principal: entityPrincipal,
        propertyData: {
          fincaNumber: '45678',
          fincaFolio: '201',
          fincaBook: '455',
          fincaDepartment: 'Guatemala',
          registryName: 'Registro General de la Propiedad',
          propertyDescription: 'Inmueble urbano ubicado en zona 10',
          propertyValue: 'Q. 2,000,000.00',
          propertyValueInWords: 'Dos millones de quetzales',
          mortgageInscription: 'Inscripción 12345',
        },
      };

    case ContractType.PAYMENT_RELEASE:
      return {
        ...basePreviewData, type,
        policies: [],
        guarantors: [],
        originDocumentData: {
          escrituraNumber: '123',
          escrituraNotary: 'Lic. Ana María Rodríguez',
          escrituraDate: '2024-06-15',
          escrituraCity: 'la ciudad de Guatemala',
        },
        propertyData: {
          fincaNumber: '45678',
          fincaFolio: '201',
          fincaBook: '455',
          fincaDepartment: 'Guatemala',
          registryName: 'Registro General de la Propiedad',
          propertyDescription: 'Inmueble urbano',
          propertyValue: 'Q. 2,000,000.00',
          propertyValueInWords: 'Dos millones de quetzales',
          mortgageInscription: 'Inscripción No. 12345',
        },
      };

    case ContractType.FUND_DEPOSIT:
      return {
        ...basePreviewData, type,
        depositData: {
          depositAmount: 100000,
          depositAmountInWords: 'Cien mil quetzales',
          depositDate: '2026-01-15',
          receiptNumber: 'RC-2026-0045',
          interestRate: '5% anual',
        },
      };

    case ContractType.CLAIM_SETTLEMENT:
      return {
        ...basePreviewData, type,
        principal: entityPrincipal,
        claimData: {
          indemnityAmount: 250000,
          indemnityAmountInWords: 'Doscientos cincuenta mil quetzales',
          checkNumber: '78901',
          checkDate: '2026-03-20',
          issuingBank: 'Banco de Desarrollo Rural, Sociedad Anónima',
          subrogationTarget: 'Constructora ABC, S.A.',
        },
      };

    case ContractType.FUND_RETURN_INDIVIDUAL:
      return {
        ...basePreviewData, type,
        depositData: {
          depositAmount: 75000,
          depositAmountInWords: 'Setenta y cinco mil quetzales',
          depositDate: '2025-06-01',
          receiptNumber: 'RC-2025-0120',
          interestRate: '4% anual',
        },
      };

    case ContractType.FUND_RETURN_ENTITY:
      return {
        ...basePreviewData, type,
        principal: entityPrincipal,
        depositData: {
          depositAmount: 200000,
          depositAmountInWords: 'Doscientos mil quetzales',
          depositDate: '2025-03-10',
          receiptNumber: 'RC-2025-0088',
          interestRate: '5% anual',
        },
      };

    case ContractType.DEBT_RECOGNITION:
      return {
        ...basePreviewData, type,
        principal: entityPrincipal,
        policies: [],
        debtPlanData: {
          debtAmount: 500000,
          debtAmountInWords: 'Quinientos mil quetzales',
          termMonths: 24,
          startDate: '2026-05-01',
          endDate: '2028-04-30',
          numberOfPayments: 24,
          paymentAmount: 23500,
          paymentAmountInWords: 'Veintitrés mil quinientos quetzales',
          interestRate: '18% anual más IVA',
          paymentDay: 'dentro de los últimos cinco días de cada mes',
        },
      };

    default:
      return { ...basePreviewData, type };
  }
}
