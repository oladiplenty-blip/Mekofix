import { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack Param List
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  CustomerSignup: undefined;
  MechanicSignup: undefined;
  VendorSignup: undefined;
  OTPVerification: {
    email?: string;
    phone?: string;
  };
  ForgotPassword: undefined;
};

// Customer Stack Param List
export type CustomerStackParamList = {
  CustomerTabs: NavigatorScreenParams<CustomerTabsParamList>;
  ServiceRequest: { mechanic: any };
  RequestTracking: { requestId: string };
  TransactionCompletion: { requestId: string };
  History: undefined;
  Payments: undefined;
  EditProfile: undefined;
};

export type CustomerTabsParamList = {
  HomeTab: undefined;
  HistoryTab: undefined;
  MarketplaceTab: undefined;
  ProfileTab: undefined;
};

// Mechanic Stack Param List
export type MechanicStackParamList = {
  MechanicTabs: NavigatorScreenParams<MechanicTabsParamList>;
  ActiveJob: { requestId: string };
};

export type MechanicTabsParamList = {
  HomeTab: undefined;
  RequestsTab: undefined;
  WalletTab: undefined;
  ProfileTab: undefined;
};

// Vendor Stack Param List
export type VendorStackParamList = {
  VendorTabs: NavigatorScreenParams<VendorTabsParamList>;
};

export type VendorTabsParamList = {
  ProductsTab: undefined;
  OrdersTab: undefined;
  WalletTab: undefined;
  ProfileTab: undefined;
};

// Root Navigator Param List
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Customer: NavigatorScreenParams<CustomerStackParamList>;
  Mechanic: NavigatorScreenParams<MechanicStackParamList>;
  Vendor: NavigatorScreenParams<VendorStackParamList>;
};

// Declare global types for navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

