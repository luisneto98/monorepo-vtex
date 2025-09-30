import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkContextData {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string;
}

const NetworkContext = createContext<NetworkContextData | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    // Get initial network state
    const initNetwork = async () => {
      const state = await NetInfo.fetch();
      updateNetworkState(state);
    };

    initNetwork();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      updateNetworkState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const updateNetworkState = (state: NetInfoState) => {
    setIsConnected(state.isConnected ?? false);
    setIsInternetReachable(state.isInternetReachable);
    setConnectionType(state.type);
  };

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        isInternetReachable,
        connectionType,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextData => {
  const context = useContext(NetworkContext);

  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }

  return context;
};