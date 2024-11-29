import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import Internet from '../../Screens/InvoiceScreen/Internet';
import Local from '../../Screens/InvoiceScreen/Local';

const Tab = createMaterialTopTabNavigator();

function MyTabs({selectedDate, orderBokerId}) {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Local">
        {props => (
          <Local
            {...props}
            selectedDate={selectedDate}
            orderBokerId={orderBokerId}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Internet">
        {props => (
          <Internet
            {...props}
            selectedDate={selectedDate}
            orderBokerId={orderBokerId}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default MyTabs;
