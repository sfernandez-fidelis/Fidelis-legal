import { ContractType } from '../../types';

export function getTemplateTypeLabel(type: ContractType) {
  switch (type) {
    case ContractType.COUNTER_GUARANTEE_PRIVATE:
      return 'Contragarantía privada';
    case ContractType.COUNTER_GUARANTEE_PUBLIC:
      return 'Contragarantía pública';
    case ContractType.MORTGAGE_GUARANTEE:
      return 'Garantía hipotecaria';
    default:
      return type;
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
