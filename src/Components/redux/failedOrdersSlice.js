import {createSlice} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  orders: [],
};

// Helper function to save orders to AsyncStorage
const saveOrdersToStorage = async (userId, orders) => {
  try {
    await AsyncStorage.setItem(
      `failedOrders-${userId}`,
      JSON.stringify(orders),
    );
  } catch (e) {
    console.error('Failed to save orders to AsyncStorage', e);
  }
};

const failedOrdersSlice = createSlice({
  name: 'failedOrders',
  initialState,
  reducers: {
    addFailedOrder(state, action) {
      state.orders.push(action.payload); // Add new failed order
    },
    setFailedOrders(state, action) {
      console.log('Setting failed orders in state:', action.payload);
      state.orders = action.payload; // Set the fetched orders
    },

    removeFailedOrder(state, action) {
      state.orders = state.orders.filter(
        order => order.details[0].pricing_id !== action.payload.pricingId,
      );
    },
    resetFailedOrders(state) {
      state.orders = []; // Reset the failed orders when account changes
    },
  },
});

export const {
  addFailedOrder,
  setFailedOrders,
  removeFailedOrder,
  resetFailedOrders,
} = failedOrdersSlice.actions;

export default failedOrdersSlice.reducer;

// Async actions to load orders from AsyncStorage
export const loadFailedOrders = userId => async dispatch => {
  try {
    const savedOrders = await AsyncStorage.getItem(`failedOrders-${userId}`);
    const orders = savedOrders ? JSON.parse(savedOrders) : [];
    console.log('Loaded orders from AsyncStorage:', orders);
    dispatch(setFailedOrders(orders)); // Set orders in Redux state
  } catch (error) {
    console.error('Failed to load orders from AsyncStorage:', error);
  }
};

// Async actions to save orders to AsyncStorage after any update
export const saveFailedOrders = (userId, orders) => async () => {
  await saveOrdersToStorage(userId, orders);
};
