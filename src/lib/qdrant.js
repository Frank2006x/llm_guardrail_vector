import { QdrantClient } from '@qdrant/js-client-rest';

// Validate environment variables
function validateEnvironment() {
  const required = ['QDRANT_URL', 'QDRANT_API_KEY', 'GOOGLE_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Initialize Qdrant client
function createQdrantClient() {
  validateEnvironment();
  
  return new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
  });
}

let qdrantClient = null;

export async function getQdrantClient() {
  if (!qdrantClient) {
    qdrantClient = createQdrantClient();
    
    // Test connection
    try {
      await qdrantClient.getCollections();
      console.log('✓ Qdrant connection established');
    } catch (error) {
      console.error('✗ Qdrant connection failed:', error.message);
      throw new Error('Failed to connect to Qdrant: ' + error.message);
    }
  }
  
  return qdrantClient;
}

export async function ensureCollection(collectionName = 'llm_guardrail_attacks') {
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
        distance: 'Cosine'
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