import React, { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { processPendingEdits } from './syncService';

const NetworkProvider = ({ children }) => {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log('Network connected. Attempting to sync pending edits...');
        processPendingEdits();
      }
    });

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        processPendingEdits();
      }
    });

    return () => unsubscribe();
  }, []);

  return <>{children}</>;
};

export default NetworkProvider;
