import { authConstants } from "../actions/constants";

// Original initial state
const initState = {
  token: null,
  user: {
    firstName: "",
    lastName: "",
    email: "",
    picture: "",
  },
  authenticate: false,
  authenticating: false,
};

export default (state = initState, action) => {
  switch (action.type) {
    case authConstants.LOGIN_REQUEST:
      return {
        ...state,
        authenticating: true,
      };
    case authConstants.LOGIN_SUCCESS:
    case authConstants.SKIP_LOGIN_SUCCESS:
      return {
        ...state,
        authenticate: true,
        authenticating: false,
        user: action.payload.user,
        token: action.payload.token,
      };
    case authConstants.LOGOUT_SUCCESS:
       return {
         ...initState,
         authenticate: false
       };
    case authConstants.SIGNUP_SUCCESS: {
      console.log("SIGNUP SUCCESS");
      return {
        ...state,
        authenticate: true,
        authenticating: false,
      };
    }
    default:
      return state;
  }
};
