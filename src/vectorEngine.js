import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { addAttack } from "./vectorStore.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let initialized = false

export async function initializeVectorDB() {

  if (initialized) return

  try {

    const file = path.join(__dirname, "../data/known_attacks.json")
    const raw = fs.readFileSync(file, "utf8")

    const attacks = JSON.parse(raw)

    for (const attack of attacks) {
      await addAttack(attack.text, attack)
    }

    initialized = true
    console.log("Local vector DB initialized")

  } catch (err) {

    console.warn("Failed to load known attacks:", err.message)
  }
}
