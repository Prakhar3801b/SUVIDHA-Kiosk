const pool = require('./pool');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
    const migrationsDir = path.join(__dirname, '../../../database/migrations');
    if (!fs.existsSync(migrationsDir)) {
        console.log('[DB] No migrations directory found, skipping.');
        return;
    }
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        try {
            await pool.query(sql);
            console.log(`[DB] ✅ Migration applied: ${file}`);
        } catch (err) {
            // Ignore "already exists" errors from IF NOT EXISTS
            if (!err.message.includes('already exists')) {
                console.error(`[DB] ❌ Migration failed: ${file}`, err.message);
            }
        }
    }
    console.log('[DB] All migrations done.');
}

module.exports = { runMigrations };
