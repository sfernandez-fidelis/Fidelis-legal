export enum ContractType {
  COUNTER_GUARANTEE_PRIVATE = 'COUNTER_GUARANTEE_PRIVATE',
  COUNTER_GUARANTEE_PUBLIC = 'COUNTER_GUARANTEE_PUBLIC',
  MORTGAGE_GUARANTEE = 'MORTGAGE_GUARANTEE',
}

export interface PartyDetails {
  name: string;
  age: string;
  maritalStatus: string;
  profession: string;
  domicile: string;
  idNumber: string; // DPI
  cui: string; // 13 digits
  isRepresenting: boolean;
  role?: string; // e.g., "Administrador Único y Representante Legal"
  entityName?: string;
  notaryName?: string;
  actDate?: string;
  regNumber?: string;
  regFolio?: string;
  regBook?: string;
}

export interface Policy {
  number: string;
  type: string;
  amount: number;
  amountInWords: string;
}

export interface CounterGuaranteeData {
  id?: string;
  userId?: string;
  type: ContractType;
  contractDate: string;
  principal: PartyDetails;
  guarantors: PartyDetails[];
  policies: Policy[];
  notificationAddress: string;
  beneficiaryName: string;
  signatureNames: string[];
  createdAt: string;
}
