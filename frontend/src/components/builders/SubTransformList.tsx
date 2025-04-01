import React from "react";
import { useDrag } from "react-dnd/dist/hooks";
import { SubTransformTemplate } from "./models/TransformModels";
import { BASE_SUB_TRANSFORM_TEMPLATES } from "./models/SubTransformTemplates";
import "../../styles/global.css";
import "../../styles/TransformEditorCard.css";

const SubTransformCard: React.FC<{ subTransform: SubTransformTemplate }> = ({
  subTransform,
}) => {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: "SUB_TRANSFORM",
    item: { ...subTransform },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={dragRef as unknown as React.Ref<HTMLDivElement>}
      className="subtransform-card"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab",
      }}
    >
      <h4>{subTransform.name}</h4>
    </div>
  );
};

const SubTransformList: React.FC = () => {
  return (
    <div className="subtransform-list">
      {BASE_SUB_TRANSFORM_TEMPLATES.map((st) => (
        <SubTransformCard key={st.id} subTransform={st} />
      ))}
    </div>
  );
};

export default SubTransformList;
