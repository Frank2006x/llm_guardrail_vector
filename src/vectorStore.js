import * as lancedb from "@lancedb/lancedb"
import { embedText } from "./embedder.js"

let table = null
let tablePromise = null

async function getTable() {

  if (table) return table

  if (!tablePromise) {

    tablePromise = (async () => {

      const db = await lancedb.connect("./lance_db")

      try {
        table = await db.openTable("attacks")
      } catch {

        table = await db.createTable("attacks", [
          {
            id: "init",
            vector: new Array(384).fill(0),
            text: "init",
            type: "init"
          }
        ])

        await table.delete("id = 'init'")
      }

      return table
    })()
  }

  return tablePromise
}

export async function addAttack(text, metadata = {}) {

  const tbl = await getTable()
  const vector = await embedText(text)

  await tbl.add([
    {
      id: `attack_${Date.now()}`,
      vector,
      text,
      type: metadata.type || "unknown"
    }
  ])
}

export async function searchSimilar(prompt, threshold = 0.75) {

  const tbl = await getTable()
  const vector = await embedText(prompt)

  const results = await tbl.search(vector).limit(5).toArray()

  const matches = results
    .map(r => {
      const similarity = 1 - r._distance
      return {
        similarity,
        text: r.text,
        type: r.type
      }
    })
    .filter(r => r.similarity >= threshold)

  return {
    detected: matches.length > 0,
    matches,
    maxSimilarity:
      matches.length > 0
        ? Math.max(...matches.map(m => m.similarity))
        : 0
  }
}
