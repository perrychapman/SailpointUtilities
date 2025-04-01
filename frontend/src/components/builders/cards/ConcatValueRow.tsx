import React from "react";
import { useDrop } from "react-dnd/dist";
import { v4 as uuidv4 } from "uuid";
import { SubTransform } from "../models/TransformModels";
import { SubTransformTemplate } from "../models/SubTransformTemplates";
import "../../../styles/global.css";
import "../../../styles/TransformEditorCard.css";

interface ConcatValueRowProps {
  value: string | SubTransform;
  index: number;
  onUpdate: (index: number, newVal: any) => void;
  onRemove: (index: number) => void;
  onOpenNested: (transform: SubTransform) => void;
  onAddNestedTransform?: (nested: SubTransform) => void;
  onRemoveNestedTransform?: (nestedId: string) => void;
  onRecursiveDelete?: (id: string) => void;
}

const ConcatValueRow: React.FC<ConcatValueRowProps> = ({
  value,
  index,
  onUpdate,
  onRemove,
  onOpenNested,
  onAddNestedTransform,
  onRemoveNestedTransform,
  onRecursiveDelete,
}) => {
  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: "SUB_TRANSFORM",
    drop: (item: SubTransformTemplate) => {
      const newTransform: SubTransform = {
        id: uuidv4(),
        name: item.name,
        type: item.type,
        attributes: JSON.parse(JSON.stringify(item.attributes || {})),
      };
      onUpdate(index, newTransform);
      onAddNestedTransform?.(newTransform);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      className="concat-value-row"
      ref={dropRef}
      style={{ backgroundColor: isOver ? "#eef" : undefined }}
    >
      {typeof value === "string" ? (
        <>
          <input
            type="text"
            value={value}
            onChange={(e) => onUpdate(index, e.target.value)}
          />
          <button className="accent-btn" onClick={() => onRemove(index)}>
            Remove
          </button>
        </>
      ) : (
        <div className="nested-card">
          <div>
            <strong>{value.name || value.type}</strong>
            <div className="nested-card-type">{value.type}</div>
          </div>
          <div className="nested-card-actions">
            <button className="secondary-btn" onClick={() => onOpenNested(value)}>
              Edit
            </button>
            <button
              className="accent-btn"
              onClick={() => {
                onRemove(index);
                onRemoveNestedTransform?.(value.id);
                onRecursiveDelete?.(value.id);
              }}
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConcatValueRow;
