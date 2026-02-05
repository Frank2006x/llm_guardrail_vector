import { pipeline } from "@xenova/transformers"

let model = null

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms))
}

async function loadModelWithRetry(retries = 3) {

  for (let i = 0; i < retries; i++) {

    try {
      console.log("Loading embedding model...")

      const m = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      )

      console.log("Embedding model ready")
      return m

    } catch (err) {

      if (i === retries - 1) throw err

      console.log(`Retry ${i + 1}/${retries}`)
      await sleep(2000)
    }
  }
}

export async function embedText(text) {

  if (!model) {
    model = await loadModelWithRetry()
  }

  const output = await model(text, {
    pooling: "mean",
    normalize: true
  })

  return Array.from(output.data)
}
