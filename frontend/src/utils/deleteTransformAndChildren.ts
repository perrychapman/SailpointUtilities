// frontend/src/utils/deleteTransformAndChildren.ts
import { SubTransform } from "../components/builders/models/TransformModels";

export const deleteTransformAndChildren = (
  id: string,
  transforms: SubTransform[]
): SubTransform[] => {
  const idsToDelete = new Set<string>();
  const collectIds = (parentId: string) => {
    idsToDelete.add(parentId);
    transforms
      .filter((t) => t.parentId === parentId)
      .forEach((child) => collectIds(child.id));
  };

  collectIds(id);
  return transforms.filter((t) => !idsToDelete.has(t.id));
};
