import { initializeVectorDB } from "./vectorEngine.js";
import { searchSimilar } from "./vectorStore.js";
import { setConfig } from "./lib/qdrant.js";

let enabled = false;

export async function enableVectorLayer(config = {}) {
  // Set configuration if provided
  if (Object.keys(config).length > 0) {
    setConfig(config);
  }
  
  await initializeVectorDB();
  enabled = true;
}

export async function vectorCheck(prompt, threshold = 0.75) {
  if (!enabled) return null;

  return await searchSimilar(prompt, threshold);
}
