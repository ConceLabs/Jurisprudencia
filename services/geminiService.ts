import { GoogleGenAI, GenerateContentResponse, Content, Type } from "@google/genai";
import type { LegalDocument, Message } from "../types";
import { Role } from "../types";

// Ensure the API key is available as an environment variable.
const apiKey = process.env.API_KEY;
if (!apiKey) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });
const model = 'gemini-2.5-flash';

function buildSystemInstruction(documents: LegalDocument[]): string {
    const documentsContext = documents.map((doc, index) => {
    return `
--- INICIO DOCUMENTO ${index + 1}: "${doc.title}" ---
${doc.content}
--- FIN DOCUMENTO ${index + 1} ---
    `;
  }).join('\n\n');

  return `Eres "Asistente Jurisprudencia", un asistente legal altamente especializado. Tu única base de conocimiento son los siguientes documentos de jurisprudencia proporcionados. Tu tarea es responder preguntas basándote exclusivamente en la información contenida en estos textos.

  Reglas estrictas:
  1.  **Cíñete al texto:** No utilices conocimiento externo. Si la respuesta no se encuentra en los documentos, debes indicar claramente: "La información no se encuentra en los documentos proporcionados".
  2.  **Sé preciso:** Evita hacer suposiciones o interpretaciones. Basa tus respuestas en los hechos y declaraciones explícitas del texto.
  3.  **Cita tus fuentes:** Cuando sea posible, menciona el título del documento del cual extrajiste la información.
  4.  **Sintetiza:** Si una pregunta requiere información de múltiples documentos, combínala en una respuesta coherente.
  5.  **No inventes:** Nunca debes crear información que no esté presente.
  6.  **Responde en español.**

  Aquí está el repositorio de documentos:
  ${documentsContext}
  `;
}

/**
 * Generates a chat response using a stateless request, compatible with all browsers.
 * @param documents An array of legal documents to be used as context.
 * @param history The current chat history.
 * @returns A promise that resolves to a GenerateContentResponse.
 */
export async function generateChatResponse(documents: LegalDocument[], history: Message[]): Promise<GenerateContentResponse> {
    const systemInstruction = buildSystemInstruction(documents);
    
    // Convert our Message[] format to the format required by the Google GenAI API (Content[])
    // We skip the very first message if it's from the model (the initial welcome message)
    const contents: Content[] = history
        .slice(history.length > 0 && history[0].role === Role.Model ? 1 : 0)
        .map(msg => ({
            role: msg.role, // 'user' or 'model'
            parts: [{ text: msg.content }],
        }));

    const response = await ai.models.generateContent({
        model: model,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2,
          topP: 0.9,
          topK: 32,
        }
    });

    return response;
}


/**
 * Generates relevant questions based on document summaries.
 * @param documents An array of legal documents.
 * @returns A promise that resolves to an array of string suggestions.
 */
export async function generateSuggestions(documents: LegalDocument[]): Promise<string[]> {
  const summaries = documents.map(doc => `- ${doc.summary} (del documento '${doc.title}')`).join('\n');

  const prompt = `
    Basado en los siguientes resúmenes de documentos legales, genera 4 a 6 preguntas interesantes y específicas que un usuario podría hacer.
    Las preguntas deben ser concisas, directas y estar formuladas como si las hiciera un usuario.

    Resúmenes:
    ${summaries}
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              description: "Lista de 4 a 6 preguntas sugeridas.",
              items: {
                type: Type.STRING,
                description: "Una pregunta sugerida."
              }
            }
          },
          required: ["suggestions"],
        },
        temperature: 0.5,
      },
    });

    const jsonStr = response.text.trim();
    const parsedData = JSON.parse(jsonStr);

    if (parsedData.suggestions && Array.isArray(parsedData.suggestions) && parsedData.suggestions.every((item: any) => typeof item === 'string')) {
      return parsedData.suggestions;
    } else {
      console.warn("Parsed JSON from schema is not in the expected format:", parsedData);
      return [];
    }
  } catch (e) {
    console.error("Failed to generate or parse suggestions:", e);
    return []; // Return empty array on failure
  }
}