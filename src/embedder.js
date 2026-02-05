import { GoogleGenerativeAI } from "@google/generative-ai";

let genai = null;
let embeddingModel = null;

function validateApiKey() {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY environment variable is required");
  }
}

async function getEmbeddingModel() {
  if (!embeddingModel) {
    validateApiKey();

    genai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    embeddingModel = genai.getGenerativeModel({ model: "text-embedding-004" });

    console.log("✓ Gemini embedding model initialized");
  }

  return embeddingModel;
}

export async function embedText(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Text input is required and must be a string");
  }

  try {
    const model = await getEmbeddingModel();
    const result = await model.embedContent(text);

    if (!result.embedding || !result.embedding.values) {
      throw new Error("Invalid embedding response from Gemini");
    }

    return result.embedding.values;
  } catch (error) {
    console.error("Failed to embed text:", error.message);

    if (error.message.includes("API_KEY")) {
      throw new Error(
        "Invalid Google API key. Please check your GOOGLE_API_KEY environment variable.",
      );
    }

    throw new Error(`Embedding failed: ${error.message}`);
  }
}

export async function embedTexts(texts) {
  if (!Array.isArray(texts)) {
    throw new Error("Texts must be an array");
  }

  try {
    const embeddings = await Promise.all(texts.map((text) => embedText(text)));

    return embeddings;
  } catch (error) {
    console.error("Failed to embed texts:", error.message);
    throw error;
  }
}
