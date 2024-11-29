// import {Add_To_Cart, Get_All_Cart, Remove_All_Cart} from './constants';

// const initialState = [];

// export const reducer = (state = initialState, action) => {
//   //   console.log(state,'bbb')
//   switch (action.type) {
//     // case Add_To_Cart:
//     //     // console.log(action.payload);
//     //     const existingIndex = state.findIndex(item => item.pricing_id === action.payload.pricing_id);
//     //     // console.log(existingIndex)

//     //     if (!action.payload) return state;
//     //     if (existingIndex !== -1) {
//     //         // If item exists, replace it with the new payload
//     //         const updatedState = [...state];
//     //         updatedState[existingIndex] = action.payload;
//     //         return updatedState;
//     //     } else {
//     //         // If item doesn't exist, add the new item to the cart
//     //         return [...state, action.payload];
//     //     }
//     case Add_To_Cart:
//       // Check if the payload is valid
//       if (!action.payload) return state;

//       // Find the index of the existing item in the state
//       const existingIndex = state.findIndex(
//         item => item.pricing_id === action.payload.pricing_id,
//       );

//       // If the item has both 'carton_ordered' and 'box_ordered' as 0, remove it from the state
//       console.log(
//         action.payload.carton_ordered,
//         '!9',
//         action.payload.box_ordered === 0,
//       );
//       if (
//         action.payload.carton_ordered === 0 &&
//         action.payload.box_ordered === 0
//       ) {
//         // Return a new state excluding the item with 'pricing_id' that matches the payload
//         return state.filter(
//           item => item.pricing_id !== action.payload.pricing_id,
//         );
//       }

//       if (existingIndex !== -1) {
//         // If item exists, replace it with the new payload
//         const updatedState = [...state];
//         updatedState[existingIndex] = action.payload;
//         return updatedState;
//       } else {
//         // If item doesn't exist, add the new item to the state
//         return [...state, action.payload];
//       }

//     case Get_All_Cart:
//       return state;
//     case Remove_All_Cart:
//       return [];
//     default:
//       return state;
//   }
// };
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
