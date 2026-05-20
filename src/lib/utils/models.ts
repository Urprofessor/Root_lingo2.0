import modelsData from '@/data/models.json';
import type { Provider, Model, ProviderId, ModelRef } from '@/types';

export const ALL_PROVIDERS: Provider[] = modelsData.providers as Provider[];

export function getProvider(id: ProviderId): Provider | undefined {
  return ALL_PROVIDERS.find((p) => p.id === id);
}

export function getModel(ref: ModelRef): Model | undefined {
  const provider = getProvider(ref.providerId);
  return provider?.models.find((m) => m.id === ref.modelId);
}

export function getModelLabel(ref: ModelRef): string {
  return getModel(ref)?.label || ref.modelId;
}

export function getFullModelLabel(ref: ModelRef): string {
  const provider = getProvider(ref.providerId);
  const model = getModel(ref);
  if (!provider || !model) return ref.modelId;
  return `${model.label}`;
}

// 拍平所有模型,供下拉使用
export interface FlatModel {
  providerId: ProviderId;
  providerLabel: string;
  modelId: string;
  modelLabel: string;
}

export const FLAT_MODELS: FlatModel[] = ALL_PROVIDERS.flatMap((p) =>
  p.models.map((m) => ({
    providerId: p.id,
    providerLabel: p.label,
    modelId: m.id,
    modelLabel: m.label,
  }))
);

// 默认模型(用于初始化)
export const DEFAULT_MODEL: ModelRef = {
  providerId: 'anthropic',
  modelId: 'claude-sonnet-4.6',
};

export const DEFAULT_JUDGE_MODEL: ModelRef = {
  providerId: 'anthropic',
  modelId: 'claude-opus-4.6',
};

export const DEFAULT_SECONDARY_MODEL: ModelRef = {
  providerId: 'openai',
  modelId: 'gpt-5.5',
};
