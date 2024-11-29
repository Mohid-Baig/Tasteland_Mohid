import {combineReducers} from 'redux';
import {reducer} from './reducer'; // Your other reducer
import {UnProductive_reducer} from './UnProductive_reducer'; // Another reducer
import failedOrdersReducer from './failedOrdersSlice'; // Import the failed orders slice

// Combine all reducers
export default combineReducers({
  reducer, // Existing reducer
  UnProductive_reducer, // Existing reducer
  failedOrders: failedOrdersReducer, // Add failedOrdersReducer with a key "failedOrders"
});
