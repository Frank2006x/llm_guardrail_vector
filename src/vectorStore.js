import { ChromaClient } from "chromadb"
import { embedText } from "./embedder.js"

let collection = null
let client = null

async function getCollection() {

  if (!collection) {

    client = new ChromaClient({
      path: "./chroma_db"
    })

    collection = await client.getOrCreateCollection({
      name: "llm_guardrail_attacks"
    })
  }

  return collection
}
