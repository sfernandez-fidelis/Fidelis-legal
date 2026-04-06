import { ContractType } from '../../types';

export function getTemplateTypeLabel(type: ContractType) {
  switch (type) {
    case ContractType.COUNTER_GUARANTEE_PRIVATE:
      return 'Contragarantia privada';
    case ContractType.COUNTER_GUARANTEE_PUBLIC:
      return 'Contragarantia escritura publica';
    case ContractType.MORTGAGE_GUARANTEE:
      return 'Garantia hipotecaria';
    default:
      return type;
  }
}

export function getTemplateStateLabel(state: 'draft' | 'published' | 'archived') {
  switch (state) {
    case 'draft':
      return 'Draft';
    case 'published':
      return 'Published';
    case 'archived':
      return 'Archived';
    default:
      return state;
  }
}
