import React, { createContext, useContext, useEffect, useState } from 'react';
import Pusher from 'pusher-js';

const PusherContext = createContext();

export const PusherProvider = ({ children }) => {
    const [pusher, setPusher] = useState(null);

    useEffect(() => {
        const initPusher = async () => {
            try {
                const response = await fetch('http://localhost:3002/api/settings/public');
                const settings = await response.json();

                if (settings.pusher_key && settings.pusher_cluster) {
                    const pusherInstance = new Pusher(settings.pusher_key, {
                        cluster: settings.pusher_cluster,
                        encrypted: true
                    });
                    setPusher(pusherInstance);
                }
            } catch (error) {
                console.error('Error initializing Pusher:', error);
            }
        };

        initPusher();

        return () => {
            if (pusher) {
                pusher.disconnect();
            }
        };
    }, []);

    return (
        <PusherContext.Provider value={pusher}>
            {children}
        </PusherContext.Provider>
    );
};

export const usePusher = () => {
    return useContext(PusherContext);
};
