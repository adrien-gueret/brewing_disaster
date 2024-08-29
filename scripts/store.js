import { storeKey } from "./save.js";

let state = {};
let reducer;

export const getState = () => state;
export const setState = (newState) => {
  state = newState;
  storeKey("state", state);
};

export const dispatch = (action) => setState(reducer(state, action));

export default function init(defaultReducer, defaultState) {
  reducer = defaultReducer;
  state = defaultState;
}
