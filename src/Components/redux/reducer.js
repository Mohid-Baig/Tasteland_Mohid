import {
  Add_To_Cart,
  Get_All_Cart,
  Remove_All_Cart,
  Remove_From_Cart,
} from './constants';

const initialState = [];

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case Add_To_Cart:
      if (!action.payload) return state;

      const existingIndex = state.findIndex(
        item => item.pricing_id === action.payload.pricing_id,
      );

      if (
        action.payload.carton_ordered === 0 &&
        action.payload.box_ordered === 0
      ) {
        return state.filter(
          item => item.pricing_id !== action.payload.pricing_id,
        );
      }

      if (existingIndex !== -1) {
        const updatedState = [...state];
        updatedState[existingIndex] = action.payload;
        return updatedState;
      } else {
        return [...state, action.payload];
      }

    case Get_All_Cart:
      return state;

    case Remove_All_Cart:
      return []; // Clear cart when action is dispatched

    case Remove_From_Cart: // Use the correct constant for removing
      console.log('Current State:', state);
      console.log('Removing Item with pricing_id:', action.payload);
      const newState = state.filter(
        item => item.details[0].pricing_id !== action.payload,
      );
      console.log('New State after deletion:', newState);
      return newState;

    default:
      return state;
  }
};
