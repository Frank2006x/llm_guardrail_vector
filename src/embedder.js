import { pipeline } from "@xenova/transformers"

let embedder = null

export async function getEmbedder() {
  if (!embedder) {
    console.log("Loading embedding model...")
    
    embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    )

    console.log("Embedding model ready")
  }

  return embedder
}

export async function embedText(text) {
  const model = await getEmbedder()

  const output = await model(text, {
    pooling: "mean",
    normalize: true
  })

  return Array.from(output.data)
}
