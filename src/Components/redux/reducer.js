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

      console.log(state, 'state');

      // Find if the item is already in the cart
      const existingIndex = state.findIndex(
        item => item.pricing_id === action.payload.pricing_id,
      );

      // If both carton_ordered and box_ordered are zero, remove the item from the cart
      if (
        action.payload.carton_ordered === 0 &&
        action.payload.box_ordered === 0
      ) {
        return state.filter(
          item => item.pricing_id !== action.payload.pricing_id,
        );
      }

      if (existingIndex !== -1) {
        // Update the existing item in the cart
        const updatedState = [...state];
        updatedState[existingIndex] = {
          ...updatedState[existingIndex],
          carton_ordered: action.payload.carton_ordered,
          box_ordered: action.payload.box_ordered,
        };
        return updatedState;
      } else {
        // Add a new item if it's not already in the cart
        return [...state, action.payload];
      }

    case Get_All_Cart:
      return state;

    case Remove_All_Cart:
      return []; // Clear cart when action is dispatched

    case Remove_From_Cart:
      // Remove the item from the cart based on pricing_id
      return state.filter(item => item.pricing_id !== action.payload);

    default:
      return state;
  }
};
