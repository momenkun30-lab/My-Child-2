import { GoogleGenAI } from "@google/genai";

// الموديلات الرسمية والمستقرة المتوافقة تماماً مع الحزمة الجديدة
const TEXT_MODEL = "gemini-2.5-flash"; 
const IMAGE_MODEL = "imagen-3.0-generate-002"; 

// دالة لإعادة المحاولة الذكية في حال وجود ضغط مؤقت
async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) throw error;
    if (error.message?.includes("SAFETY") || error.message?.includes("403")) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

// دالة للتحقق من جنس الوالدين قبل البدء
export async function validateParentsGender(fatherBase64: string, motherBase64: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await retry(() => ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [
        { text: `Analyze these two photos. Photo 1: Father (Male), Photo 2: Mother (Female). Verify their gender and return ONLY a valid JSON object: {"fatherIsMale": boolean, "motherIsFemale": boolean}` },
        { inlineData: { mimeType: "image/jpeg", data: fatherBase64.split(",")[1] } },
        { inlineData: { mimeType: "image/jpeg", data: motherBase64.split(",")[1] } }
      ]
    }));

    const text = response.text || "";
    const match = text.match(/\{.*\}/s);
    const result = match ? JSON.parse(match[0]) : {};

    if (result.fatherIsMale && result.motherIsFemale) return { isValid: true };
    return { 
      isValid: false, 
      error: !result.fatherIsMale ? 'father_not_male' : 'mother_not_female' 
    };
  } catch (e) { 
    return { isValid: true }; 
  }
}

// الدالة الرئيسية لتوليد صورة الطفل المدمجة بالطريقة الصحيحة للمكتبة
export async function generateChildImage(fatherBase64: string, motherBase64: string, gender: string, age: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  // 1. توليد الوصف النصي أولاً باستخدام generateContent
  const desc = await retry(() => ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [
      { text: `Generate a photorealistic image prompt for a ${gender} child, age ${age}, blending the unique biological features from Photo 1 (Father) and Photo 2 (Mother) perfectly. Output ONLY the description prompt in English.` },
      { inlineData: { mimeType: "image/jpeg", data: fatherBase64.split(",")[1] } },
      { inlineData: { mimeType: "image/jpeg", data: motherBase64.split(",")[1] } }
    ]
  }));

  const prompt = desc.text?.trim() || `Portrait of a ${age} ${gender} child, hyperrealistic, blending parents features.`;

  // 2. توليد الصورة باستخدام الدالة المخصصة لها رسميّاً generateImages
  const imgRes = await retry(() => ai.models.generateImages({
    model: IMAGE_MODEL,
    prompt: prompt,
    config: {
      aspectRatio: "1:1",
      numberOfImages: 1,
      outputMimeType: "image/jpeg"
    }
  }));

  // استخراج الصورة من الهيكل الصحيح لـ generateImages
  const base64Image = imgRes.generatedImages?.[0]?.image?.imageBytes;
  if (!base64Image) {
    throw new Error("فشل توليد الصورة من الموديل السحابي، يرجى التحقق من فلاتر الأمان.");
  }

  return `data:image/jpeg;base64,${base64Image}`;
}
