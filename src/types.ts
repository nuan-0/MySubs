import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  name?: string;
  email: string;
  country?: string;
  currency?: '₹' | '$';
  isPro?: boolean;
  proExpiryDate?: Timestamp;
  isAdmin?: boolean;
  trialStartDate: Timestamp;
  pin: string;
  tempPin?: string | null;
  resetApproved?: boolean;
}

export interface Config {
  id: string;
  proPriceMonthly: number;
  proPriceYearly: number;
  proPriceMonthlyOld?: number;
  proPriceYearlyOld?: number;
  currency?: string;
}

export interface Subscription {
  id: string;
  uid: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  nextRenewal: Timestamp;
  createdAt: Timestamp;
  category: 'Entertainment' | 'Productivity' | 'Utilities' | 'Food' | 'Health' | 'Other';
  status: 'active' | 'paused';
  icon?: string;
}

export interface ResetRequest {
  id: string;
  email: string;
  requestedAt: Timestamp;
  status?: 'pending' | 'resolved' | 'denied';
  tempPin?: string;
  resolvedAt?: Timestamp;
}

export interface Message {
  id: string;
  uid: string;
  email: string;
  content: string;
  sentAt: Timestamp;
  status: 'unread' | 'read' | 'replied';
  reply?: string;
}
