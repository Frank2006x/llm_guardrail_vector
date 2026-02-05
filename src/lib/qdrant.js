import { QdrantClient } from "@qdrant/js-client-rest";

// Global config storage
let globalConfig = {
  qdrantUrl: null,
  qdrantApiKey: null,
  googleApiKey: null
};

// Set configuration programmatically
export function setConfig(config) {
  globalConfig = {
    qdrantUrl: config.qdrantUrl || globalConfig.qdrantUrl,
    qdrantApiKey: config.qdrantApiKey || globalConfig.qdrantApiKey,
    googleApiKey: config.googleApiKey || globalConfig.googleApiKey
  };
  
  // Reset client to force recreation with new config
  qdrantClient = null;
  
  // Also reset embedding model when config changes
  try {
    const { resetEmbeddingModel } = require('../embedder.js');
    resetEmbeddingModel();
  } catch (error) {
    // Embedder might not be loaded yet, ignore
  }
  
  console.log('✓ Configuration updated');
}

// Get configuration from global config or environment variables
export function getConfig() {
  return {
    qdrantUrl: globalConfig.qdrantUrl || process.env.QDRANT_URL,
    qdrantApiKey: globalConfig.qdrantApiKey || process.env.QDRANT_API_KEY,
    googleApiKey: globalConfig.googleApiKey || process.env.GOOGLE_API_KEY
  };
}

// Validate configuration
function validateEnvironment() {
  const config = getConfig();
  const missing = [];
  
  if (!config.qdrantUrl) missing.push("qdrantUrl (or QDRANT_URL)");
  if (!config.qdrantApiKey) missing.push("qdrantApiKey (or QDRANT_API_KEY)");
  if (!config.googleApiKey) missing.push("googleApiKey (or GOOGLE_API_KEY)");

  if (missing.length > 0) {
    throw new Error(
      `Missing required configuration: ${missing.join(", ")}. ` +
      `Provide via setConfig() or environment variables.`
    );
  }
  
  return config;
}

// Initialize Qdrant client
function createQdrantClient() {
  const config = validateEnvironment();

  return new QdrantClient({
    url: config.qdrantUrl,
    apiKey: config.qdrantApiKey,
  });
}

let qdrantClient = null;

export async function getQdrantClient() {
  if (!qdrantClient) {
    qdrantClient = createQdrantClient();

    // Test connection
    try {
      await qdrantClient.getCollections();
      console.log("✓ Qdrant connection established");
    } catch (error) {
      console.error("✗ Qdrant connection failed:", error.message);
      throw new Error("Failed to connect to Qdrant: " + error.message);
    }
  }

  return qdrantClient;
}

export async function ensureCollection(
  collectionName = "llm_guardrail_attacks",
) {
  const client = await getQdrantClient();

  try {
    // Check if collection exists
    await client.getCollection(collectionName);
    console.log(`✓ Collection "${collectionName}" exists`);
  } catch (error) {
    // Collection doesn't exist, create it
    console.log(`Creating collection "${collectionName}"...`);

    await client.createCollection(collectionName, {
      vectors: {
        size: 768, // Google text-embedding-004 dimensions
        distance: "Cosine",
      },
      optimizers_config: {
        default_segment_number: 2,
      },
      replication_factor: 1,
    });

    console.log(`✓ Collection "${collectionName}" created`);
  }

  return collectionName;
}
