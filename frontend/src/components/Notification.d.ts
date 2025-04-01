import React from "react";
import "../styles/global.css";
import "../styles/Notification.css";
interface NotificationProps {
    message: string;
    type: "success" | "error" | "info";
    onClose: () => void;
}
declare const Notification: React.FC<NotificationProps>;
export default Notification;
