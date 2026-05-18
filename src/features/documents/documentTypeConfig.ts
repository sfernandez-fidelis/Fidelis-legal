import { ContractType } from '../../types';

/**
 * Defines which form sections (steps) apply to each contract type.
 * The DocumentEditor uses this to build a dynamic wizard.
 */
export type FormSection =
  | 'general'        // Title, date, beneficiary, notifications
  | 'principal'      // PartyForm for principal
  | 'guarantors'     // PartyForm[] for guarantors
  | 'policies'       // PolicyForm[]
  | 'property'       // PropertyForm (finca)
  | 'movableAssets'  // MovableAssetsForm
  | 'deposit'        // DepositForm
  | 'claim'          // ClaimForm
  | 'debtPlan'       // DebtPlanForm
  | 'originDocument' // OriginDocumentForm
  | 'maxAmount'      // Max guarantee amount (accesorio múltiple)
  | 'signatures';    // Signature block

export interface DocumentTypeConfig {
  type: ContractType;
  label: string;
  shortLabel: string;
  description: string;
  format: 'private' | 'public';
  sections: FormSection[];
  /** Step labels for the wizard (grouped from sections) */
  steps: { label: string; sections: FormSection[] }[];
}

const configs: Record<ContractType, DocumentTypeConfig> = {
  [ContractType.COUNTER_GUARANTEE_PRIVATE]: {
    type: ContractType.COUNTER_GUARANTEE_PRIVATE,
    label: 'Contragarantía privada (Individual)',
    shortLabel: 'CG Individual',
    description: 'Documento privado con firmas legalizadas — persona individual',
    format: 'private',
    sections: ['general', 'principal', 'guarantors', 'policies', 'signatures'],
    steps: [
      { label: 'Datos generales', sections: ['general'] },
      { label: 'Partes', sections: ['principal', 'guarantors'] },
      { label: 'Pólizas', sections: ['policies'] },
      { label: 'Firmas', sections: ['signatures'] },
    ],
  },
  [ContractType.COUNTER_GUARANTEE_PRIVATE_ENTITY]: {
    type: ContractType.COUNTER_GUARANTEE_PRIVATE_ENTITY,
    label: 'Contragarantía privada (Sociedad)',
    shortLabel: 'CG Sociedad',
    description: 'Documento privado con firmas legalizadas — sociedad o entidad',
    format: 'private',
    sections: ['general', 'principal', 'guarantors', 'policies', 'signatures'],
    steps: [
      { label: 'Datos generales', sections: ['general'] },
      { label: 'Partes', sections: ['principal', 'guarantors'] },
      { label: 'Pólizas', sections: ['policies'] },
      { label: 'Firmas', sections: ['signatures'] },
    ],
  },
  [ContractType.COUNTER_GUARANTEE_PUBLIC]: {
    type: ContractType.COUNTER_GUARANTEE_PUBLIC,
    label: 'Contragarantía pública (Escritura)',
    shortLabel: 'CG Escritura',
    description: 'Escritura pública de contragarantía fiduciaria',
    format: 'public',
    sections: ['general', 'principal', 'guarantors', 'policies', 'signatures'],
    steps: [
      { label: 'Datos generales', sections: ['general'] },
      { label: 'Partes', sections: ['principal', 'guarantors'] },
      { label: 'Pólizas', sections: ['policies'] },
      { label: 'Firmas', sections: ['signatures'] },
    ],
  },
  [ContractType.COUNTER_GUARANTEE_MULTIPLE]: {
    type: ContractType.COUNTER_GUARANTEE_MULTIPLE,
    label: 'Accesorio múltiple',
    shortLabel: 'Accesorio Múlt.',
    description: 'Garantía fiduciaria para emisión múltiple de pólizas',
    format: 'private',
    sections: ['general', 'principal', 'maxAmount', 'signatures'],
    steps: [
      { label: 'Datos generales', sections: ['general'] },
      { label: 'Parte obligada', sections: ['principal', 'maxAmount'] },
      { label: 'Firmas', sections: ['signatures'] },
    ],
  },
  [ContractType.MOVABLE_GUARANTEE]: {
    type: ContractType.MOVABLE_GUARANTEE,
    label: 'Contragarantía mobiliaria',
    shortLabel: 'CG Mobiliaria',
    description: 'Contragarantía con garantía sobre bienes muebles',
    format: 'public',
    sections: ['general', 'principal', 'guarantors', 'policies', 'movableAssets', 'signatures'],
    steps: [
      { label: 'Datos generales', sections: ['general'] },
      { label: 'Partes', sections: ['principal', 'guarantors'] },
      { label: 'Pólizas y bienes', sections: ['policies', 'movableAssets'] },
      { label: 'Firmas', sections: ['signatures'] },
    ],
  },
  [ContractType.MORTGAGE_GUARANTEE]: {
    type: ContractType.MORTGAGE_GUARANTEE,
    label: 'Garantía hipotecaria',
    shortLabel: 'Hipoteca',
    description: 'Escritura pública de constitución de garantía hipotecaria',
    format: 'public',
    sections: ['general', 'principal', 'guarantors', 'policies', 'property', 'signatures'],
    steps: [
      { label: 'Datos generales', sections: ['general'] },
      { label: 'Partes', sections: ['principal', 'guarantors'] },
      { label: 'Pólizas e inmueble', sections: ['policies', 'property'] },
      { label: 'Firmas', sections: ['signatures'] },
    ],
  },
  [ContractType.PAYMENT_RELEASE]: {
    type: ContractType.PAYMENT_RELEASE,
    label: 'Carta de pago',
    shortLabel: 'Carta Pago',
    description: 'Carta de pago total y liberación de gravamen hipotecario',
    format: 'public',
    sections: ['general', 'originDocument', 'property', 'signatures'],
    steps: [
      { label: 'Datos generales', sections: ['general'] },
      { label: 'Escritura de origen', sections: ['originDocument'] },
      { label: 'Datos del inmueble', sections: ['property'] },
      { label: 'Firmas', sections: ['signatures'] },
    ],
  },
  [ContractType.FUND_DEPOSIT]: {
    type: ContractType.FUND_DEPOSIT,
    label: 'Depósito de fondos',
    shortLabel: 'Depósito',
    description: 'Contrato de depósito de fondos en garantía',
    format: 'private',
    sections: ['general', 'principal', 'policies', 'deposit', 'signatures'],
    steps: [
      { label: 'Datos generales', sections: ['general'] },
      { label: 'Parte depositante', sections: ['principal'] },
      { label: 'Póliza y depósito', sections: ['policies', 'deposit'] },
      { label: 'Firmas', sections: ['signatures'] },
    ],
  },
  [ContractType.CLAIM_SETTLEMENT]: {
    type: ContractType.CLAIM_SETTLEMENT,
    label: 'Finiquito por reclamo',
    shortLabel: 'Finiquito Reclamo',
    description: 'Finiquito total por pago de reclamo de fianza',
    format: 'public',
    sections: ['general', 'principal', 'policies', 'claim', 'signatures'],
    steps: [
      { label: 'Datos generales', sections: ['general'] },
      { label: 'Parte beneficiaria', sections: ['principal'] },
      { label: 'Póliza y reclamo', sections: ['policies', 'claim'] },
      { label: 'Firmas', sections: ['signatures'] },
    ],
  },
  [ContractType.FUND_RETURN_INDIVIDUAL]: {
    type: ContractType.FUND_RETURN_INDIVIDUAL,
    label: 'Finiquito devolución (Individual)',
    shortLabel: 'Finiquito Dev. Ind.',
    description: 'Finiquito por devolución de fondos en garantía — persona individual',
    format: 'private',
    sections: ['general', 'principal', 'policies', 'deposit', 'signatures'],
    steps: [
      { label: 'Datos generales', sections: ['general'] },
      { label: 'Parte depositante', sections: ['principal'] },
      { label: 'Póliza y depósito', sections: ['policies', 'deposit'] },
      { label: 'Firmas', sections: ['signatures'] },
    ],
  },
  [ContractType.FUND_RETURN_ENTITY]: {
    type: ContractType.FUND_RETURN_ENTITY,
    label: 'Finiquito devolución (Sociedad)',
    shortLabel: 'Finiquito Dev. Soc.',
    description: 'Finiquito por devolución de fondos en garantía — sociedad',
    format: 'private',
    sections: ['general', 'principal', 'policies', 'deposit', 'signatures'],
    steps: [
      { label: 'Datos generales', sections: ['general'] },
      { label: 'Parte depositante', sections: ['principal'] },
      { label: 'Póliza y depósito', sections: ['policies', 'deposit'] },
      { label: 'Firmas', sections: ['signatures'] },
    ],
  },
  [ContractType.DEBT_RECOGNITION]: {
    type: ContractType.DEBT_RECOGNITION,
    label: 'Reconocimiento de deuda',
    shortLabel: 'Rec. Deuda',
    description: 'Reconocimiento de deuda puro y simple con plan de pagos',
    format: 'public',
    sections: ['general', 'principal', 'debtPlan', 'signatures'],
    steps: [
      { label: 'Datos generales', sections: ['general'] },
      { label: 'Parte deudora', sections: ['principal'] },
      { label: 'Plan de pagos', sections: ['debtPlan'] },
      { label: 'Firmas', sections: ['signatures'] },
    ],
  },
};

export function getDocumentTypeConfig(type: ContractType): DocumentTypeConfig {
  return configs[type] ?? configs[ContractType.COUNTER_GUARANTEE_PRIVATE];
}

export function getAllDocumentTypeConfigs(): DocumentTypeConfig[] {
  return Object.values(configs);
}

/** Check whether a contract type requires guarantors */
export function typeHasGuarantors(type: ContractType): boolean {
  return getDocumentTypeConfig(type).sections.includes('guarantors');
}

/** Check whether a contract type requires policies */
export function typeHasPolicies(type: ContractType): boolean {
  return getDocumentTypeConfig(type).sections.includes('policies');
}
