import { GoogleGenAI, Type } from "@google/genai";
import { Problem, SubmissionResult } from "../types";

// Helper to convert File to Base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:application/pdf;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
console.log('🔑 測試 API Key...');
console.log('API Key 長度:', process.env.API_KEY?.length);
console.log('API Key 前10字符:', process.env.API_KEY?.substring(0, 10));
console.log('API Key 後5字符:', process.env.API_KEY?.substring(-5));
// 測試 API Key 是否有效的簡單函數
export const testApiKey = async (): Promise<boolean> => {
  try {
    console.log('🔑 測試 API Key...');
    console.log('API Key 長度:', process.env.API_KEY?.length);
    console.log('API Key 前10字符:', process.env.API_KEY?.substring(0, 10));
    console.log('API Key 後5字符:', process.env.API_KEY?.substring(-5));
    
    const response = await ai.models.generateContent({
      model: "gemini-pro",
      contents: "請回答：Hello"
    });
    
    console.log('✅ API Key 測試成功！');
    console.log('回應:', response.text);
    return true;
  } catch (error) {
    console.error('❌ API Key 測試失敗:', error);
    console.error('錯誤詳情:', JSON.stringify(error, null, 2));
    return false;
  }
};

export const parsePdfProblems = async (base64Data: string): Promise<Problem[]> => {
  const model = "gemini-pro"; // 使用最穩定的基本模型

  try {
    console.log('📄 正在解析 PDF，模型:', model);
    console.log('🔑 API Key 狀態:', process.env.API_KEY ? '已載入' : '未載入');
    
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Data,
            },
          },
          {
            text: `
            You are a specialized PDF extractor for programming problems.
            Please analyze this PDF and extract the programming problems into a structured format.

            CRITICAL FORMATTING INSTRUCTIONS:
            1. **Fix Line Breaks (De-hyphenation)**: PDF text extraction often results in words being split across lines or sentences breaking mid-flow. You MUST merge these lines back into coherent paragraphs. Do not leave random newlines in the middle of sentences.
            2. **Preserve Structure**: The 'description' field MUST be formatted using Markdown.
               - Use **Bold** for headers like 'Input Format', 'Output Format'.
               - Use \`\`\` (code blocks) for **Sample Input** and **Sample Output**. This is extremely important for readability.
            3. **Content Requirements**:
               - Include the full Problem Statement.
               - Include Input/Output constraints.
               - **Sample Input** and **Sample Output** are MANDATORY. If they exist in the PDF, you must transcribe them exactly.
            
            Return a JSON array where each object represents a problem with:
            - id: Problem number (e.g., "1", "Q2").
            - title: Problem title.
            - description: The full formatted text (Markdown allowed).
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "The problem number" },
              title: { type: Type.STRING, description: "The problem title" },
              description: { type: Type.STRING, description: "Full problem description in Markdown. Ensure Sample Inputs are in code blocks." }
            },
            required: ["id", "title", "description"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as Problem[];

  } catch (error) {
    console.error("Error parsing PDF:", error);
    console.error("API Key 長度:", process.env.API_KEY?.length);
    console.error("使用的模型:", model);
    if (error.message?.includes('API key not valid')) {
      throw new Error("API Key 無效，請檢查 Gemini API Key 設定");
    }
    throw new Error("無法解析 PDF，請確認檔案格式或稍後再試。");
  }
};

export const gradeCode = async (problem: Problem, userCode: string): Promise<SubmissionResult> => {
  const model = "gemini-pro"; // 使用最穩定的基本模型

  try {
    console.log('📝 正在評分程式碼，模型:', model);
    console.log('🔑 API Key 狀態:', process.env.API_KEY ? '已載入' : '未載入');
    const prompt = `
      你是一個嚴格的 Python 程式設計助教。
      
      題目資訊:
      ID: ${problem.id}
      標題: ${problem.title}
      描述: ${problem.description}

      學生提交的 Python 程式碼:
      \`\`\`python
      ${userCode}
      \`\`\`

      請評估學生的程式碼：
      1. 邏輯正確性：是否解決了題目要求的問題？(包含 Sample Input 測試)
      2. 語法正確性：是否有語法錯誤？
      3. 邊界條件：是否考慮了可能的輸入情況？

      請以 JSON 格式回傳評分結果。
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Score from 0 to 100" },
            isCorrect: { type: Type.BOOLEAN, description: "Whether the solution is functionally correct" },
            feedback: { type: Type.STRING, description: "Detailed feedback explaining errors or praising good practices" },
            suggestedSolution: { type: Type.STRING, description: "A correct reference implementation (optional but recommended if incorrect)" }
          },
          required: ["score", "isCorrect", "feedback"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as SubmissionResult;

  } catch (error) {
    console.error("Error grading code:", error);
    console.error("API Key 長度:", process.env.API_KEY?.length);
    console.error("使用的模型:", model);
    if (error.message?.includes('API key not valid')) {
      throw new Error("API Key 無效，請檢查 Gemini API Key 設定");
    }
    throw new Error("評分系統暫時無法使用，請稍後再試。");
  }
};