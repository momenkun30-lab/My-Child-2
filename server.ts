import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import dotenv from "dotenv";

// تفعيل قراءة متغيرات البيئة من ملف .env
dotenv.config();

// تحويل المنفذ إلى رقم بشكل صارم لإجبار TypeScript على قبوله وتخطي أخطاء الـ Build في Render
const PORT: number = Number(process.env.PORT) || 3000;

// الرابط السحابي الخاص بك مدمج به اسم المستخدم وكلمة السر الصحيحة
const DEFAULT_MONGODB_URI = "mongodb+srv://admin:prPxXYs7PqCwXEGO@cluster0.odxgej5.mongodb.net/tifliDB?retryWrites=true&w=majority&appName=Cluster0";
const MONGODB_URI = (process.env.MONGODB_URI || DEFAULT_MONGODB_URI).trim();

async function startServer() {
  const app = express();
  
  // رفع الحد الأقصى لحجم البيانات إلى 50 ميجابايت للسماح برفع صور الوالدين بجودة عالية دون أخطاء
  app.use(express.json({ limit: "50mb" })); 
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // 1. الاتصال بقاعدة البيانات MongoDB السحابية
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 20000, 
      connectTimeoutMS: 20000,
    });
    console.log("✅ Connected to MongoDB Atlas successfully");
  } catch (err: any) {
    console.error("❌ MongoDB connection error:", err.message);
  }

  // 2. تعريف نموذج الإحصائيات (Database Schema)
  const statsSchema = new mongoose.Schema({
    totalPredictions: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
    id: { type: String, default: "global", unique: true }
  });
  const Stats = mongoose.model("Stats", statsSchema);

  // دالة مساعدة للحصول على سجل الإحصائيات العالمي أو إنشائه إن لم يكن موجوداً
  async function getGlobalStats() {
    try {
      let stats = await Stats.findOne({ id: "global" });
      if (!stats) {
        stats = await Stats.create({ id: "global", totalPredictions: 0 });
      }
      return stats;
    } catch (e) {
      // في حال حدوث مشكلة مؤقتة في الاتصال، نرجع كائن مؤقت (Fallback) لكي لا يتوقف الموقع
      return new Stats({ totalPredictions: 0 });
    }
  }

  // 3. مسارات الـ API
  
  // الحصول على إحصائيات الموقع
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await getGlobalStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // تحديث الإحصائيات وزيادة العداد بمقدار 1 عند إتمام عملية توقع (توليد) جديدة
  app.post("/api/stats/increment", async (req, res) => {
    try {
      const stats = await Stats.findOneAndUpdate(
        { id: "global" },
        { $inc: { totalPredictions: 1 }, lastUpdated: new Date() },
        { upsert: true, new: true }
      );
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to update stats" });
    }
  });

  // مسار لفحص حالة السيرفر
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // 4. تكامل بيئة التشغيل Vite (التطوير ضد الإنتاج)
  if (process.env.NODE_ENV !== "production") {
    // في وضع التطوير المحلي: استخدم Vite Middleware لتحديث الكود تلقائياً
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // في وضع الإنتاج (مثل الرفع على Render): تقديم الملفات النهائية المبنية
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // 5. تشغيل السيرفر واستماع الطلبات باستخدام المنفذ الرقمي الصريح والآمن
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
}

// تشغيل السيرفر ومعالجة أي خطأ حرج عند البدء
startServer().catch((err) => {
  console.error("🔥 Server failed to start:", err);
});
