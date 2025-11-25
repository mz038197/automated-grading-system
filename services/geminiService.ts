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

export const parsePdfProblems = async (base64Data: string): Promise<Problem[]> => {
  const model = "gemini-2.5-flash"; // High context window, good for reading docs

  try {
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
            Please analyze this PDF and extract the programming problems. 
            
            IMPORTANT FORMATTING INSTRUCTIONS:
            1. Fix broken lines: PDF text often breaks lines in the middle of sentences. Please merge them back into coherent paragraphs.
            2. Structure: The 'description' field MUST include:
               - The Problem Statement.
               - Input Format requirements.
               - Output Format requirements.
               - **Sample Input** and **Sample Output** (This is mandatory. Do not skip).
            3. Layout: Use clear spacing between sections in the description.
            
            Return a JSON array where each object represents a problem with:
            - id: Problem number (e.g., "1", "Q2").
            - title: Problem title.
            - description: The full formatted text as described above.
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
              description: { type: Type.STRING, description: "Full problem description including Sample Input/Output, with fixed line breaks." }
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
    throw new Error("無法解析 PDF，請確認檔案格式或稍後再試。");
  }
};

export const gradeCode = async (problem: Problem, userCode: string): Promise<SubmissionResult> => {
  const model = "gemini-3-pro-preview"; // Smarter model for logic checking

  try {
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
    throw new Error("評分系統暫時無法使用，請稍後再試。");
  }
};