import { SubTransform } from "./models/TransformModels";
import ConcatTransformCard from "./cards/ConcatTransformCard";

export interface TransformTypeConfig {
  label: string;
  component: React.FC<{
    transform: SubTransform;
    updateTransform: (updated: SubTransform) => void;
    removeTransform: () => void;
    onEditNested?: (nested: SubTransform) => void;
    onAddNestedTransform?: (nested: SubTransform) => void;
    onRemoveNestedTransform?: (nestedId: string) => void;
    onRecursiveDelete?: (id: string) => void;
  }>;
  defaultAttributes: Record<string, any>;
}

export const transformRegistry: Record<string, TransformTypeConfig> = {
  concat: {
    label: "Concat",
    component: ConcatTransformCard,
    defaultAttributes: {
      values: [],
    },
  },
};

export const getTransformComponent = (type: string) =>
  transformRegistry[type]?.component;

export const getDefaultAttributes = (type: string) =>
  transformRegistry[type]?.defaultAttributes ?? {};
