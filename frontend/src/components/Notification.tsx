import React, { useEffect, useState } from "react";
import "../styles/global.css";
import "../styles/Notification.css";

interface NotificationProps {
    message: string;
    type: "success" | "error" | "info";
    onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(onClose, 300); // Wait for exit animation
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`notification ${type} ${exiting ? "fade-out" : ""}`}>
            <span className="notification-message">{message}</span>
            <button className="close-btn" onClick={onClose}>×</button>
        </div>
    );
};

export default Notification;
