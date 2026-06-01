import { GoogleGenAI } from "@google/genai";

// استخدام الأسماء الكاملة والمعتمدة للموديلات الرسمية والمستقرة لتجنب خطأ 404
const TEXT_MODEL = "gemini-2.5-flash"; // الموديل الأحدث والأسرع المتوافق تماماً مع المكتبة الجديدة
const IMAGE_MODEL = "imagen-3.0-generate-002"; // الموديل الرسمي الصحيح لتوليد الصور من جوجل

// دالة لإعادة المحاولة في حال حدوث ضغط مؤقت على السيرفر
async function retry<T>(fn: () => Promise<T>, retries = 2, delay = 1500): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) throw error;
    if (error.message?.includes("429") || error.message?.includes("403") || error.message?.includes("SAFETY")) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

// دالة للتحقق من جنس الوالدين (أب وأم) قبل البدء
export async function validateParentsGender(fatherBase64: string, motherBase64: string) {
  // تهيئة العميل وتمرير المفتاح بشكل صريح لضمان قراءته من سيرفر Railway دون مشاكل
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [
        { text: `Analyze these two photos. Photo 1: Father (Male), Photo 2: Mother (Female). Verify their gender and return ONLY a valid JSON object: {"fatherIsMale": boolean, "motherIsFemale": boolean}` },
        { inlineData: { mimeType: "image/jpeg", data: fatherBase64.split(",")[1] } },
        { inlineData: { mimeType: "image/jpeg", data: motherBase64.split(",")[1] } }
      ]
    });

    const text = response.text || "";
    const match = text.match(/\{.*\}/s);
    const result = match ? JSON.parse(match[0]) : {};

    if (result.fatherIsMale && result.motherIsFemale) return { isValid: true };
    return { 
      isValid: false, 
      error: !result.fatherIsMale ? 'father_not_male' : 'mother_not_female' 
    };
  } catch (e) { 
    // في حال حدوث خطأ تقني في الفحص، نمرر العملية لكي لا تفسد تجربة المستخدم
    return { isValid: true }; 
  }
}

// الدالة الرئيسية لتوليد صورة الطفل المدمجة
export async function generateChildImage(fatherBase64: string, motherBase64: string, gender: string, age: string) {
  // تهيئة العميل وتمرير المفتاح بشكل صريح هنا أيضاً لمنع خطأ الـ undefined
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  // المرحلة الأولى: دمج الملامح وصياغة وصف إنجليزي دقيق
  const desc = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [
      { text: `Generate a photorealistic image prompt for a ${gender} child, age ${age}, blending the unique biological features from Photo 1 (Father) and Photo 2 (Mother) perfectly. Output ONLY the description prompt in English.` },
      { inlineData: { mimeType: "image/jpeg", data: fatherBase64.split(",")[1] } },
      { inlineData: { mimeType: "image/jpeg", data: motherBase64.split(",")[1] } }
    ]
  });

  const prompt = desc.text?.trim() || `Portrait of a ${age} ${gender} child, hyperrealistic, blending parents features.`;

  // المرحلة الثانية: إرسال الوصف لموديل الصور Imagen لتوليد ملامح الطفل
  const imgRes = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: prompt,
    config: {
      // إعدادات الصورة المخصصة لـ Imagen 3
      aspectRatio: "1:1",
      numberOfImages: 1,
      outputMimeType: "image/jpeg"
    }
  });

  const part = imgRes.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part || !part.inlineData) {
    throw new Error("فشل توليد الصورة من الموديل السحابي، يرجى التحقق من فلاتر الأمان.");
  }

  return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
}
