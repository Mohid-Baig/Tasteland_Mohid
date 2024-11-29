// NetworkProvider.js
import React, {useEffect} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {processPendingEdits} from './syncService';

const NetworkProvider = ({children}) => {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log('Network connected. Attempting to sync pending edits...');
        processPendingEdits(); // Call your syncing function
      }
    });

    // Initial check when the component mounts
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        processPendingEdits(); // Sync if already connected
      }
    });

    return () => unsubscribe();
  }, []);

  return <>{children}</>; // Render children components
};

export default NetworkProvider;
