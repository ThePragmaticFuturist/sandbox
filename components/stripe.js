import Constants from 'expo-constants';
import { Platform } from 'react-native';

const backendUrl = Platform.OS === 'ios' 
  ? "https://2q4i4ntsb6wosj5tmzynt7vsky0kwpni.lambda-url.us-east-1.on.aws/"
  : "https://2q4i4ntsb6wosj5tmzynt7vsky0kwpni.lambda-url.us-east-1.on.aws/";

const invoiceRedeemedTix = async (customer_id, redeemed_id, tix_description, email)=> {
  const res = await fetch(backendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: null,
      email: null,
      customerid: customer_id,
      paymentmethodid: null,
      product: "redeemed", //selected or redeemed
      amount: 1, //quantity
      description: tix_description,
      processinvoice: false,
      subscription: false,
      subscriptionitem: redeemed_id,
      newexpirationdate: false,
      checkexpiredpayment: false,
    }),
  });

  const response = await res.json();
  return response;
};

const invoiceSelectedTix = async (customer_id, selected_id, tix_name, email)=> {
  await fetch(backendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: null,
      email: null,
      customerid: customer_id,
      product: "selected", //selected or redeemed
      amount: 1,
      description: tix_name,
      paymentmethodid: null,
      processinvoice: false,
      subscription: false,
      subscriptionitem: selected_id,
      newexpirationdate: false,
      checkexpiredpayment: false,
    }),
  });
};

export {
  invoiceSelectedTix,
  invoiceRedeemedTix
}