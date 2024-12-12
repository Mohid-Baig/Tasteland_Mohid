import React from 'react';
import { Provider } from 'react-redux';
import StackNavigation from './src/Navigations/StackNavigation/StackNavigation';
import { MenuProvider } from 'react-native-popup-menu';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import store from './src/Components/redux/store'; // Redux store file
import NetworkProvider from './src/Screens/ShopScreen/NetworkProvider';

const AppWrapper = () => {
  return <StackNavigation />; // This will handle all the navigation
};

const App = () => {
  return (
    <Provider store={store}> 
        <NetworkProvider> 
          <GestureHandlerRootView>
            <MenuProvider> 
              <AppWrapper /> 
            </MenuProvider>
          </GestureHandlerRootView>
        </NetworkProvider>
    </Provider>
  );
};

export default App;
