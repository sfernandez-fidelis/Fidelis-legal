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
      return 'Borrador';
    case 'ready':
      return 'Listo';
    case 'generated':
      return 'Generado';
    case 'archived':
      return 'Archivado';
    default:
      return 'Borrador';
  }
}
