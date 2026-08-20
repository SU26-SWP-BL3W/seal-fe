const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://seal_bl3w_db_user:EpO4IbgovuNVhaVANneraIPY7iqSHujJ@dpg-d9tstb2jobas73dpeld0-a.oregon-postgres.render.com:5432/seal_bl3w_db',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  const trackCols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Tracks';`);
  console.log('Tracks columns:', trackCols.rows.map(r => `${r.column_name} (${r.data_type})`));

  const roundCols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Rounds';`);
  console.log('Rounds columns:', roundCols.rows.map(r => `${r.column_name} (${r.data_type})`));

  await client.end();
}

main().catch(console.error);
