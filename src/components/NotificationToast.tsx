import type { JSX } from "react";
import type { NotificationState } from "../interface";

interface NotificationProps {
    notification: NotificationState | null;
}


export function NotificationToast({ notification }: NotificationProps): JSX.Element {

    return (
        <>
            {
                notification && (
                    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg text-white text-sm font-medium animate-bounce z-50 ${notification.type === 'error' ? 'bg-red-600' : 'bg-slate-800'
                        }`}>
                        {notification.message}
                    </div>)
            }
        </>

    );
}