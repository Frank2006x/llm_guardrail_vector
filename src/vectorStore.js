import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { getQdrantClient, ensureCollection } from "./lib/qdrant.js";

let vectorStore = null;
let vectorStorePromise = null;
let embeddings = null;

const COLLECTION_NAME = "llm_guardrail_attacks";

function generateUniqueId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `attack_${timestamp}_${random}`;
}

async function getEmbeddings() {
  if (!embeddings) {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY environment variable is required");
    }

    embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "text-embedding-004",
    });

    console.log("✓ Gemini embeddings initialized");
  }

  return embeddings;
}

async function initializeVectorStore() {
  const client = await getQdrantClient();
  const collectionName = await ensureCollection(COLLECTION_NAME);
  const embeddingModel = await getEmbeddings();

  const store = new QdrantVectorStore(embeddingModel, {
    client,
    collectionName,
    contentPayloadKey: "text",
    metadataPayloadKeys: ["type", "id"],
  });

  console.log("✓ QdrantVectorStore initialized");
  return store;
}

async function getVectorStore() {
  if (vectorStore) return vectorStore;

  if (!vectorStorePromise) {
    vectorStorePromise = initializeVectorStore();
  }

  try {
    vectorStore = await vectorStorePromise;
    return vectorStore;
  } catch (error) {
    // Reset promise on failure to allow retry
    vectorStorePromise = null;
    throw error;
  }
}

export async function addAttack(text, metadata = {}) {
  if (!text || typeof text !== "string" || text.trim() === "") {
    throw new Error("Attack text is required and must be a non-empty string");
  }

  try {
    const store = await getVectorStore();
    const id = generateUniqueId();

    // Prepare document with metadata
    const document = {
      pageContent: text,
      metadata: {
        id,
        type: metadata.type || "unknown",
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };

    await store.addDocuments([document]);
    console.log(`✓ Added attack with ID: ${id}`);

    return id;
  } catch (error) {
    console.error("Failed to add attack:", error.message);
    throw new Error(`Failed to add attack: ${error.message}`);
  }
}

export async function searchSimilar(prompt, threshold = 0.65) {
  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    throw new Error("Prompt is required and must be a non-empty string");
  }

  // Normalize prompt for better matching
  const normalizedPrompt = prompt.trim().toLowerCase();

  try {
    const store = await getVectorStore();

    // Use similarity search with score on normalized prompt for better case-insensitive matching
    const results = await store.similaritySearchWithScore(normalizedPrompt, 5);

    const matches = results
      .map(([doc, score]) => ({
        similarity: score, // Qdrant returns similarity score directly
        text: doc.pageContent,
        type: doc.metadata.type || "unknown",
        id: doc.metadata.id,
        timestamp: doc.metadata.timestamp,
      }))
      .filter((match) => match.similarity >= threshold);

    return {
      detected: matches.length > 0,
      matches,
      maxSimilarity:
        matches.length > 0 ? Math.max(...matches.map((m) => m.similarity)) : 0,
      searchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error in searchSimilar:", error.message);
    throw new Error(`Search failed: ${error.message}`);
  }
}

export async function getAttackCount() {
  try {
    const client = await getQdrantClient();
    const info = await client.getCollection(COLLECTION_NAME);
    return info.points_count || 0;
  } catch (error) {
    console.error("Failed to get attack count:", error.message);
    return 0;
  }
}

export async function closeConnection() {
  if (vectorStore) {
    vectorStore = null;
    vectorStorePromise = null;
    embeddings = null;
    console.log("✓ Vector store connections closed");
  }
}
