/**
 * Migration script to move data from LanceDB to Qdrant
 * Run this script after setting up your Qdrant environment variables
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { addAttack, getAttackCount } from "../src/vectorStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrateLanceDBData() {
  console.log("🔄 Starting migration from LanceDB to Qdrant...\n");

  try {
    // Check if old LanceDB exists
    const lanceDbPath = path.join(__dirname, "../lance_db");
    if (!fs.existsSync(lanceDbPath)) {
      console.log("ℹ️  No existing LanceDB found, skipping migration");
      return;
    }

    console.log("📁 Found existing LanceDB data");

    // For now, we'll re-import from known_attacks.json since we need to re-embed
    // everything with Gemini's higher dimensional vectors anyway
    const attacksFile = path.join(__dirname, "../data/known_attacks.json");

    if (!fs.existsSync(attacksFile)) {
      console.log("❌ No known_attacks.json found for migration");
      return;
    }

    const attacksData = JSON.parse(fs.readFileSync(attacksFile, "utf8"));
    console.log(`📊 Found ${attacksData.length} attacks to migrate`);

    // Check current Qdrant count
    const currentCount = await getAttackCount();
    console.log(`📊 Current Qdrant collection has ${currentCount} vectors`);

    if (currentCount > 0) {
      console.log(
        "⚠️  Qdrant collection already has data. Skipping migration.",
      );
      console.log(
        "   To force re-migration, delete the collection in Qdrant first.",
      );
      return;
    }

    // Migrate each attack
    console.log("🚀 Starting migration...");
    let migrated = 0;

    for (const attack of attacksData) {
      try {
        await addAttack(attack.text, {
          type: attack.type || "unknown",
          migratedFrom: "lancedb",
          migratedAt: new Date().toISOString(),
        });

        migrated++;
        console.log(
          `   ✓ Migrated ${migrated}/${attacksData.length}: ${attack.type}`,
        );
      } catch (error) {
        console.error(`   ✗ Failed to migrate attack: ${error.message}`);
      }
    }

    const finalCount = await getAttackCount();
    console.log(`\n🎉 Migration complete!`);
    console.log(`   • Migrated: ${migrated}/${attacksData.length} attacks`);
    console.log(`   • Final count: ${finalCount} vectors in Qdrant`);
    console.log(`   • Old LanceDB data is still preserved in ./lance_db`);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error("   Make sure your environment variables are set correctly:");
    console.error("   - GOOGLE_API_KEY");
    console.error("   - QDRANT_URL");
    console.error("   - QDRANT_API_KEY");
    process.exit(1);
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateLanceDBData().catch(console.error);
}

export { migrateLanceDBData };
