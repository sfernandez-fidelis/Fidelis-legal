import { ContractType } from '../../types';

export function getTemplateTypeLabel(type: ContractType) {
  switch (type) {
    case ContractType.COUNTER_GUARANTEE_PRIVATE:
      return 'Contragarantía privada (Individual)';
    case ContractType.COUNTER_GUARANTEE_PRIVATE_ENTITY:
      return 'Contragarantía privada (Sociedad)';
    case ContractType.COUNTER_GUARANTEE_PUBLIC:
      return 'Contragarantía pública (Escritura)';
    case ContractType.COUNTER_GUARANTEE_MULTIPLE:
      return 'Accesorio múltiple';
    case ContractType.MOVABLE_GUARANTEE:
      return 'Contragarantía mobiliaria';
    case ContractType.MORTGAGE_GUARANTEE:
      return 'Garantía hipotecaria';
    case ContractType.PAYMENT_RELEASE:
      return 'Carta de pago';
    case ContractType.FUND_DEPOSIT:
      return 'Depósito de fondos';
    case ContractType.CLAIM_SETTLEMENT:
      return 'Finiquito por reclamo';
    case ContractType.FUND_RETURN_INDIVIDUAL:
      return 'Finiquito devolución (Individual)';
    case ContractType.FUND_RETURN_ENTITY:
      return 'Finiquito devolución (Sociedad)';
    case ContractType.DEBT_RECOGNITION:
      return 'Reconocimiento de deuda';
    default:
      return type;
  }
}

export function getTemplateShortLabel(type: ContractType) {
  switch (type) {
    case ContractType.COUNTER_GUARANTEE_PRIVATE:
      return 'CG Individual';
    case ContractType.COUNTER_GUARANTEE_PRIVATE_ENTITY:
      return 'CG Sociedad';
    case ContractType.COUNTER_GUARANTEE_PUBLIC:
      return 'CG Escritura';
    case ContractType.COUNTER_GUARANTEE_MULTIPLE:
      return 'Accesorio Múlt.';
    case ContractType.MOVABLE_GUARANTEE:
      return 'CG Mobiliaria';
    case ContractType.MORTGAGE_GUARANTEE:
      return 'Hipoteca';
    case ContractType.PAYMENT_RELEASE:
      return 'Carta Pago';
    case ContractType.FUND_DEPOSIT:
      return 'Depósito';
    case ContractType.CLAIM_SETTLEMENT:
      return 'Finiquito Reclamo';
    case ContractType.FUND_RETURN_INDIVIDUAL:
      return 'Finiquito Dev. Ind.';
    case ContractType.FUND_RETURN_ENTITY:
      return 'Finiquito Dev. Soc.';
    case ContractType.DEBT_RECOGNITION:
      return 'Rec. Deuda';
    default:
      return type;
  }
}

export function getTemplateDocumentFormat(type: ContractType): 'private' | 'public' {
  switch (type) {
    case ContractType.COUNTER_GUARANTEE_PRIVATE:
    case ContractType.COUNTER_GUARANTEE_PRIVATE_ENTITY:
    case ContractType.COUNTER_GUARANTEE_MULTIPLE:
    case ContractType.FUND_DEPOSIT:
    case ContractType.FUND_RETURN_INDIVIDUAL:
    case ContractType.FUND_RETURN_ENTITY:
      return 'private';
    case ContractType.COUNTER_GUARANTEE_PUBLIC:
    case ContractType.MOVABLE_GUARANTEE:
    case ContractType.MORTGAGE_GUARANTEE:
    case ContractType.PAYMENT_RELEASE:
    case ContractType.CLAIM_SETTLEMENT:
    case ContractType.DEBT_RECOGNITION:
      return 'public';
    default:
      return 'private';
  }
}

export function getTemplateStateLabel(state: 'draft' | 'published' | 'archived') {
  switch (state) {
    case 'draft':
      return 'Borrador';
    case 'published':
      return 'Publicado';
    case 'archived':
      return 'Archivado';
    default:
      return state;
  }
}

/** Returns the contract types grouped by category for the UI selector */
export function getContractTypeGroups(): { label: string; types: ContractType[] }[] {
  return [
    {
      label: 'Contragarantías',
      types: [
        ContractType.COUNTER_GUARANTEE_PRIVATE,
        ContractType.COUNTER_GUARANTEE_PRIVATE_ENTITY,
        ContractType.COUNTER_GUARANTEE_PUBLIC,
        ContractType.COUNTER_GUARANTEE_MULTIPLE,
        ContractType.MOVABLE_GUARANTEE,
        ContractType.MORTGAGE_GUARANTEE,
      ],
    },
    {
      label: 'Cartas y Finiquitos',
      types: [
        ContractType.PAYMENT_RELEASE,
        ContractType.CLAIM_SETTLEMENT,
        ContractType.FUND_RETURN_INDIVIDUAL,
        ContractType.FUND_RETURN_ENTITY,
      ],
    },
    {
      label: 'Depósitos y Deuda',
      types: [
        ContractType.FUND_DEPOSIT,
        ContractType.DEBT_RECOGNITION,
      ],
    },
  ];
}
