import { useEffect, useRef, useCallback } from 'react';

// 預設 10 分鐘 (毫秒)
const DEFAULT_TIMEOUT = 10 * 60 * 1000;

export const useIdleTimer = (onTimeout: () => void, timeout = DEFAULT_TIMEOUT) => {
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimer = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            console.warn("User is idle, triggering timeout sequence.");
            onTimeout();
        }, timeout);
    }, [onTimeout, timeout]);

    useEffect(() => {
        // 監聽的使用者活動事件
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

        // 綁定事件
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // 初始化啟動計時
        resetTimer();

        // 清除監聽 (Cleanup)
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [resetTimer]);
};