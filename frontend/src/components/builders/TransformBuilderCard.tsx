import React from "react";
import { FaGripVertical, FaTrash, FaEdit } from "react-icons/fa";
import { SubTransform } from "./models/TransformModels";

interface TransformBuilderCardProps {
  subTransform: SubTransform;
  onRemove: (id: string) => void;
  onEdit: (transform: SubTransform) => void;
}

const TransformBuilderCard: React.FC<TransformBuilderCardProps> = ({
  subTransform,
  onRemove,
  onEdit,
}) => {
  return (
    <div className="builder-card" style={{ marginLeft: `${(subTransform.nestingLevel ?? 0) * 20}px` }}>
      <div className="builder-drag-handle">
        <FaGripVertical />
      </div>

      <div className="builder-card-content">
        <strong>{subTransform.displayPath}. {subTransform.name || subTransform.type}</strong>
      </div>

      <div className="builder-item-actions">
        {!subTransform.isTopLevel && (
          <button
            className="builder-remove-btn"
            onClick={() => onRemove(subTransform.id)}
            title="Delete"
          >
            <FaTrash />
          </button>
        )}
        <button
          className="builder-remove-btn"
          onClick={() => onEdit(subTransform)}
          title="Edit"
        >
          <FaEdit />
        </button>
      </div>
    </div>
  );
};

export default TransformBuilderCard;
