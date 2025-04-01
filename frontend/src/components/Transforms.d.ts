import React from "react";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-json";
import "../styles/global.css";
import "../styles/Transforms.css";
interface TransformsProps {
    activeTenant: string | null;
}
declare const Transforms: React.FC<TransformsProps>;
export default Transforms;
