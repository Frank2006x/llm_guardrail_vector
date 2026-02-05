import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { addAttack } from "./vectorStore.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let initialized = false

export async function initializeVectorDB() {

  if (initialized) return

  const file = path.join(__dirname, "../data/known_attacks.json")

  const attacks = JSON.parse(fs.readFileSync(file, "utf8"))

  for (const attack of attacks) {
    await addAttack(attack.text, attack)
  }

  initialized = true
  console.log("Vector attack DB ready")
}
