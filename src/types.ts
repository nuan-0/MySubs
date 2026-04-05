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
}

export interface PricingConfig {
  monthly: number;
  yearly: number;
  monthlyOld?: number;
  yearlyOld?: number;
}

export interface Config {
  id: string;
  pricing: {
    [currency: string]: PricingConfig;
  };
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

export interface Message {
  id: string;
  uid: string;
  email: string;
  content: string;
  sentAt: Timestamp;
  status: 'unread' | 'read' | 'replied';
  reply?: string;
  repliedAt?: Timestamp;
}
