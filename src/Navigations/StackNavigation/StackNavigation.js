import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Login from '../../Screens/AuthScreens/Login';
import Home from '../../Screens/DashboardScreens/Home';
import Splash from '../../Screens/AuthScreens/Splash';
import MapStart from '../../Screens/Attendance/MapStart';
import Order from '../../Screens/OrderScreen/Order';
import Shop from '../../Screens/ShopScreen/Shop';
import AddNewShop from '../../Screens/ShopScreen/AddNewShop';
import AllShops from '../../Screens/OrderScreen/AllShops';
import CreateOrder from '../../Screens/OrderScreen/CreateOrder';
import InvoiceScreen from '../../Screens/InvoiceScreen/InvoiceScreen';
import ConfirmOrder from '../../Screens/OrderScreen/ConfirmOrder';
import ViewInvoice from '../../Screens/InvoiceScreen/ViewInvoice';
import Failed from '../../Screens/FailedScreen/Failed';
import Internet from '../../Screens/InvoiceScreen/Internet';
export default function StackNavigation() {
  const Stack = createNativeStackNavigator();
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Splash" component={Splash} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen
          name="MapStart"
          component={MapStart}
          options={{headerShown: true}}
        />
        <Stack.Screen
          name="Order"
          component={Order}
          options={{headerShown: true}}
        />
        <Stack.Screen
          name="Shop"
          component={Shop}
          options={{headerShown: true}}
        />
        <Stack.Screen
          name="Failed"
          component={Failed}
          options={{
            headerShown: true,
            headerStyle: {backgroundColor: '#ff3333'},
            headerTitle: 'Failed Requests',
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="AddNewShop"
          component={AddNewShop}
          options={{headerShown: true}}
        />
        <Stack.Screen
          name="AllShops"
          component={AllShops}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="CreateOrder"
          component={CreateOrder}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Invoice"
          component={InvoiceScreen}
          options={{headerShown: true}}
        />
        <Stack.Screen
          name="ViewInvoice"
          component={ViewInvoice}
          options={{headerShown: true, title: 'View Invoice'}}
        />
        <Stack.Screen
          name="ConfirmOrder"
          component={ConfirmOrder}
          options={{headerShown: true}}
        />
        <Stack.Screen
          name="Internet"
          component={Internet}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
