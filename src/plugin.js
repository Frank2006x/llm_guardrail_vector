import { initializeVectorDB } from "./vectorEngine.js"
import { searchSimilar } from "./vectorStore.js"

let vectorEnabled = false

export async function enableVectorLayer() {
  await initializeVectorDB()
  vectorEnabled = true
}

export async function vectorCheck(prompt) {
  if (!vectorEnabled) return null
  return await searchSimilar(prompt)
}
