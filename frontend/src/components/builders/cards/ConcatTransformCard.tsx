import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { SubTransform } from "../models/TransformModels";
import ConcatValueRow from "./ConcatValueRow";
import SubTransformList, { BASE_SUB_TRANSFORM_TEMPLATES } from "../SubTransformList";
import Modal from "../../Modal";
import { getTransformComponent } from "../TranformTypeRegistry";
import "../../../styles/global.css";
import "../../../styles/TransformEditorCard.css";

interface ConcatTransformCardProps {
  transform: SubTransform;
  updateTransform: (updated: SubTransform) => void;
  removeTransform: () => void;
  onEditNested?: (nested: SubTransform) => void;
  onAddNestedTransform?: (nested: SubTransform) => void;
  onRemoveNestedTransform?: (nestedId: string) => void;
  onRecursiveDelete?: (id: string) => void;
}

const ConcatTransformCard: React.FC<ConcatTransformCardProps> = ({
  transform,
  updateTransform,
  removeTransform,
  onEditNested,
  onAddNestedTransform,
  onRemoveNestedTransform,
  onRecursiveDelete,
}) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedNestedTransform, setSelectedNestedTransform] = useState<SubTransform | null>(null);
  const [localValues, setLocalValues] = useState<any[]>([]);

  useEffect(() => {
    setLocalValues(
      Array.isArray(transform.attributes?.values) ? transform.attributes.values : []
    );
  }, [transform]);

  const updateValueAt = (index: number, newVal: any) => {
    const updatedValues = [...localValues];
    if (typeof newVal === "object" && newVal !== null) {
      newVal.parentId = transform.id;
    }
    updatedValues[index] = newVal;
    setLocalValues(updatedValues);
    updateTransform({
      ...transform,
      attributes: {
        ...transform.attributes,
        values: updatedValues,
      },
    });
  };

  const removeValue = (index: number) => {
    const removed = localValues[index];
    const updatedValues = localValues.filter((_, i) => i !== index);
    setLocalValues(updatedValues);
    updateTransform({
      ...transform,
      attributes: {
        ...transform.attributes,
        values: updatedValues,
      },
    });

    if (typeof removed === "object" && removed.id) {
      onRemoveNestedTransform?.(removed.id);
      onRecursiveDelete?.(removed.id);
    }
  };

  const addValueSlot = () => {
    const updatedValues = [...localValues, ""];
    setLocalValues(updatedValues);
    updateTransform({
      ...transform,
      attributes: {
        ...transform.attributes,
        values: updatedValues,
      },
    });
  };

  const openNestedModal = (nested: SubTransform) => {
    if (onEditNested) {
      onEditNested(nested);
    } else {
      setSelectedNestedTransform(nested);
      setEditModalOpen(true);
    }
  };

  const handleNestedUpdate = (updated: SubTransform) => {
    const updatedValues = localValues.map((v: any) =>
      typeof v === "string" ? v : v.id === updated.id ? updated : v
    );
    setLocalValues(updatedValues);
    updateTransform({
      ...transform,
      attributes: {
        ...transform.attributes,
        values: updatedValues,
      },
    });
    setSelectedNestedTransform(null);
    setEditModalOpen(false);
  };

  return (
    <div className="transform-card wide">
      <h4>{transform.name}</h4>
      <p>Type: {transform.type}</p>

      <div className="nested-transform-editor">
        <div className="available-subtransforms">
          <h5>Available Sub-Transforms</h5>
          <SubTransformList />
        </div>

        <div className="concat-values">
          <label>Values to Concatenate:</label>
          {localValues.map((val, index) => (
            <ConcatValueRow
              key={index}
              value={val}
              index={index}
              onUpdate={updateValueAt}
              onRemove={removeValue}
              onOpenNested={openNestedModal}
              onAddNestedTransform={(nested) => {
                nested.parentId = transform.id;
                onAddNestedTransform?.(nested);
              }}
              onRemoveNestedTransform={onRemoveNestedTransform}
              onRecursiveDelete={onRecursiveDelete}
            />
          ))}

          <button className="primary-btn" onClick={addValueSlot}>
            + Add Value Slot
          </button>
        </div>
      </div>

      <button className="accent-btn" onClick={removeTransform}>
        Delete Transform
      </button>

      {editModalOpen && selectedNestedTransform && (() => {
        const NestedEditor = getTransformComponent(selectedNestedTransform.type);
        if (!NestedEditor) return null;

        return (
          <Modal
            isOpen={editModalOpen}
            title={`Edit ${selectedNestedTransform.type}`}
            onClose={() => setEditModalOpen(false)}
            onAction={() => setEditModalOpen(false)}
            actionLabel="Close"
            width="wide"
          >
            <NestedEditor
              transform={selectedNestedTransform}
              updateTransform={handleNestedUpdate}
              removeTransform={() => onRecursiveDelete?.(selectedNestedTransform.id)}
            />
          </Modal>
        );
      })()}
    </div>
  );
};

export default ConcatTransformCard;
