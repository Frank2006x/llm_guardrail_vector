import { initializeVectorDB } from "./vectorEngine.js"
import { searchSimilar } from "./vectorStore.js"

let enabled = false

export async function enableVectorLayer() {
  await initializeVectorDB()
  enabled = true
}

export async function vectorCheck(prompt, threshold = 0.75) {

  if (!enabled) return null

  return await searchSimilar(prompt, threshold)
}
