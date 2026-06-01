import { GoogleGenAI } from "@google/genai";

// استخدام النسخة المستقرة المخصصة للإنتاج والضغط العالي لتفادي خطأ 503
const TEXT_MODEL = "gemini-1.5-flash"; 
const IMAGE_MODEL = "imagen-3.0-generate-002"; 

// دالة لإعادة المحاولة في حال حدوث ضغط مؤقت على السيرفر
async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) throw error;
    // إذا كان الخطأ بسبب الضغط 503، سينتظر الكود تلقائياً ويعيد المحاولة
    if (error.message?.includes("SAFETY") || error.message?.includes("403")) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

// دالة للتحقق من جنس الوالدين (أب وأم) قبل البدء
export async function validateParentsGender(fatherBase64: string, motherBase64: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    // استخدام الـ retry المطور هنا لتفادي أي نبضات ضغط مؤقتة
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

// الدالة الرئيسية لتوليد صورة الطفل المدمجة
export async function generateChildImage(fatherBase64: string, motherBase64: string, gender: string, age: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  // المرحلة الأولى: دمج الملامح وصياغة الوصف مع ميزة إعادة المحاولة الذكية
  const desc = await retry(() => ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [
      { text: `Generate a photorealistic image prompt for a ${gender} child, age ${age}, blending the unique biological features from Photo 1 (Father) and Photo 2 (Mother) perfectly. Output ONLY the description prompt in English.` },
      { inlineData: { mimeType: "image/jpeg", data: fatherBase64.split(",")[1] } },
      { inlineData: { mimeType: "image/jpeg", data: motherBase64.split(",")[1] } }
    ]
  }));

  const prompt = desc.text?.trim() || `Portrait of a ${age} ${gender} child, hyperrealistic, blending parents features.`;

  // المرحلة الثانية: إرسال الوصف لموديل الصور Imagen
  const imgRes = await retry(() => ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: prompt,
    config: {
      aspectRatio: "1:1",
      numberOfImages: 1,
      outputMimeType: "image/jpeg"
    }
  }));

  const part = imgRes.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part || !part.inlineData) {
    throw new Error("فشل توليد الصورة من الموديل السحابي، يرجى التحقق من فلاتر الأمان.");
  }

  return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
}
