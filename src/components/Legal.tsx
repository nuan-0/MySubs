import React from 'react';
import { useNavigate } from 'react-router-dom';

const Icons = {
  ChevronLeft: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
  ),
  ShieldCheck: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
  ),
  FileText: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14.5 2 14.5 7 20 7"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
  ),
};

const LegalLayout: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 pb-12">
      <header className="flex items-center gap-3 md:gap-4 mb-8 md:mb-12">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 md:p-3 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all text-white"
        >
          <Icons.ChevronLeft />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3 text-white">
          <div className="text-purple-500">{icon}</div> {title}
        </h1>
      </header>

      <div className="bg-zinc-900/50 border border-white/10 p-6 md:p-10 rounded-3xl md:rounded-[40px] shadow-2xl space-y-8 text-white/70 leading-relaxed">
        {children}
      </div>

      <footer className="mt-12 text-center text-white/20 text-xs">
        <p>© 2026 MySubs. All rights reserved.</p>
      </footer>
    </div>
  );
};

export const PrivacyPolicy = () => (
  <LegalLayout title="Privacy Policy" icon={<Icons.ShieldCheck />}>
    <section>
      <h2 className="text-xl font-bold text-white mb-4">1. Data Collection</h2>
      <p>We collect minimal data necessary to provide our service, including your email address, name, and subscription details. Payment information is handled securely by our payment processor, Razorpay.</p>
    </section>
    <section>
      <h2 className="text-xl font-bold text-white mb-4">2. Data Usage</h2>
      <p>Your data is used solely to manage your subscriptions, provide renewal alerts, and process your Pro membership. We do not sell your personal information to third parties.</p>
    </section>
    <section>
      <h2 className="text-xl font-bold text-white mb-4">3. Security</h2>
      <p>We implement industry-standard security measures, including Firebase Authentication and Firestore Security Rules, to protect your data from unauthorized access.</p>
    </section>
    <section>
      <h2 className="text-xl font-bold text-white mb-4">4. Cookies</h2>
      <p>We use essential cookies and local storage to maintain your session and preferences. You can manage cookie settings in your browser.</p>
    </section>
  </LegalLayout>
);

export const TermsOfService = () => (
  <LegalLayout title="Terms of Service" icon={<Icons.FileText />}>
    <section>
      <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
      <p>By using MySubs, you agree to be bound by these Terms of Service. If you do not agree, please do not use the application.</p>
    </section>
    <section>
      <h2 className="text-xl font-bold text-white mb-4">2. Pro Subscription</h2>
      <p>Pro subscriptions are billed monthly or yearly. You can cancel at any time, but we do not offer refunds for partial billing periods, except for verified double-charges.</p>
    </section>
    <section>
      <h2 className="text-xl font-bold text-white mb-4">3. User Conduct</h2>
      <p>You are responsible for maintaining the confidentiality of your account and PIN. Any unauthorized use of your account should be reported immediately.</p>
    </section>
    <section>
      <h2 className="text-xl font-bold text-white mb-4">4. Limitation of Liability</h2>
      <p>MySubs is provided "as is" without warranties of any kind. We are not liable for any data loss or financial loss resulting from the use of our service.</p>
    </section>
  </LegalLayout>
);
