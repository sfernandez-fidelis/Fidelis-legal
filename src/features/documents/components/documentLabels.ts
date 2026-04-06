import { ContractType, CounterGuaranteeData, DocumentStatus } from '../../../types';

export function getDocumentTypeLabel(type: ContractType) {
  switch (type) {
    case ContractType.COUNTER_GUARANTEE_PRIVATE:
      return 'Contragarantía privada';
    case ContractType.COUNTER_GUARANTEE_PUBLIC:
      return 'Contragarantía pública';
    case ContractType.MORTGAGE_GUARANTEE:
      return 'Garantía hipotecaria';
    default:
      return 'Documento';
  }
}

export function getDocumentDisplayName(document: CounterGuaranteeData) {
  return `${document.principal.entityName || document.principal.name} - ${getDocumentTypeLabel(document.type)}`;
}

export function getDocumentStatusLabel(status?: DocumentStatus) {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'ready':
      return 'Ready';
    case 'generated':
      return 'Generated';
    case 'archived':
      return 'Archived';
    default:
      return 'Draft';
  }
}
