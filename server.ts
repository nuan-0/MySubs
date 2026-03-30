import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import admin from "firebase-admin";
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };
import Razorpay from 'razorpay';
import crypto from 'crypto';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Firebase Admin
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }
  } catch (err) {
    console.error("Firebase Admin initialization failed:", err);
  }

  // Razorpay Instance
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
  });

  // API routes
  app.post("/api/admin/reset-pin", async (req, res) => {
    const { email, newPin } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "No token provided" });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(decodedToken.uid)
        .get();
      
      const isAdmin = userDoc.data()?.isAdmin === true || 
                      decodedToken.email === "krishnaprayers108@gmail.com";

      if (!isAdmin) {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      const targetUser = await admin.auth().getUserByEmail(email);
      await admin.auth().updateUser(targetUser.uid, {
        password: newPin + "MySubs_PIN"
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("PIN reset failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Razorpay: Create Order
  app.post("/api/create-order", async (req, res) => {
    const { amount, currency = 'INR' } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "No token provided" });
    }

    try {
      const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit
        currency,
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error: any) {
      console.error("Order creation failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Razorpay: Webhook
  app.post("/api/webhook/razorpay", async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'placeholder_webhook_secret';
    const signature = req.headers['x-razorpay-signature'] as string;

    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest === signature) {
      const event = req.body.event;
      if (event === 'payment.captured') {
        const payment = req.body.payload.payment.entity;
        const orderId = payment.order_id;
        const email = payment.email;

        // In a real app, you'd find the user by orderId or email
        // For now, we'll try to find the user by email and upgrade them
        try {
          const userRecord = await admin.auth().getUserByEmail(email);
          await admin.firestore().collection('users').doc(userRecord.uid).update({
            isPro: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`User ${email} upgraded via webhook`);
        } catch (err) {
          console.error("Webhook user upgrade failed:", err);
        }
      }
      res.json({ status: 'ok' });
    } else {
      res.status(400).send('Invalid signature');
    }
  });

  // Admin Simulation (Temporary)
  app.post("/api/simulate-payment", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "No token provided" });
    }
    const idToken = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // ONLY for the admin account
      if (decodedToken.email !== "krishnaprayers108@gmail.com") {
        return res.status(403).json({ error: "Simulation only available for admin" });
      }

      await admin.firestore().collection('users').doc(decodedToken.uid).update({
        isPro: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      res.json({ success: true, message: "Simulation successful: Account upgraded to Pro" });
    } catch (error: any) {
      console.error("Simulation failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Razorpay: Upgrade User (Client-side success callback)
  app.post("/api/upgrade", async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "No token provided" });
    }

    try {
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // Verify signature to prevent "Inspect Element" hacks
      const secret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature === razorpay_signature) {
        await admin.firestore().collection('users').doc(decodedToken.uid).update({
          isPro: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({ success: true });
      } else {
        res.status(400).json({ error: "Invalid payment signature" });
      }
    } catch (error: any) {
      console.error("Upgrade failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
