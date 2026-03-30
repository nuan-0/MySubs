import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  name?: string;
  email: string;
  country?: string;
  currency?: '₹' | '$';
  isPro?: boolean;
  proUntil?: Timestamp;
  isAdmin?: boolean;
  trialStartDate: Timestamp;
}

export interface Subscription {
  id: string;
  uid: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  nextRenewal: Timestamp;
  icon?: string;
}

export interface ResetRequest {
  id: string;
  email: string;
  requestedAt: Timestamp;
}
