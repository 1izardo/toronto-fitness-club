import validator from "validator";

export const isValidEmail = (value: string) => {
  return validator.isEmail(value) ? null : "Email is invalid";
};

export const isValidPassword = (value: string) => {
  return validator.isStrongPassword(value)
    ? null
    : "Password is not strong enough (>8 chars, with at least 1 capital, lowercase, and symbol)";
};

export const isValidPhoneNum = (value: string) => {
  return validator.isMobilePhone(value, "en-CA")
    ? null
    : "Phone number is not a valid Canadian number";
};

export const isValidCreditCard = (value: string) => {
  return value.length === 16 && value.match(/^-?\d+$/)
    ? null
    : "Number is not a valid credit card number";
};

export const isValidExpiry = (value: string) => {
  return value.match(/^(0[1-9]|1[0-2])\/[0-9]{2}$/)
    ? null
    : "Number is not a valid expiry date";
};

export const isValidCVV = (value: string) => {
  return value.length === 3 && value.match(/^-?\d+$/)
    ? null
    : "Number is not a valid CVV";
};
