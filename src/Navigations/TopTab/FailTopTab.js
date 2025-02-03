import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import OrderFail from '../../Screens/FailedScreen/OrderFail';
import UnProductiveFail from '../../Screens/FailedScreen/UnProductiveFail';

const Tab = createMaterialTopTabNavigator();

function FailTopTab({userId}) {
  console.log(userId, '--');
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarIndicatorStyle: {backgroundColor: 'red'},
      }}>
      <Tab.Screen name="OrderFail" options={{title: 'Failed Orders'}}>
        {props => <OrderFail {...props} userId={userId} />}
      </Tab.Screen>
      <Tab.Screen
        name="UnProductiveFail"
        options={{title: 'Unproductive Orders'}}>
        {props => <UnProductiveFail {...props} userId={userId} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default FailTopTab;
