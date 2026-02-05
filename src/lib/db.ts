import { Pool } from 'pg';

let pool: Pool | undefined;

if (!pool) {
  // FALLBACK DE DEBUG: Usando a string fornecida diretamente se a ENV falhar
  // TODO: Remover este fallback em produção final para segurança
  const HARDCODED_URL = "postgresql://neondb_owner:npg_eHCoO6Qc5MVG@ep-old-paper-ainoxdpc-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
  
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || HARDCODED_URL;
  
  if (connectionString) {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
}

export const db = {
  query: (text: string, params?: any[]) => {
    if (!pool) throw new Error('Database not configured');
    return pool.query(text, params);
  },
  sql: async (strings: TemplateStringsArray, ...values: any[]) => {
    if (!pool) throw new Error('Database not configured');
    let text = strings[0];
    for (let i = 1; i < strings.length; i++) {
      text += `$${i}` + strings[i];
    }
    return pool.query(text, values);
  },
  connect: async () => {
    if (!pool) throw new Error('Database not configured');
    const client = await pool.connect();
    return {
      sql: async (strings: TemplateStringsArray, ...values: any[]) => {
        let text = strings[0];
        for (let i = 1; i < strings.length; i++) {
          text += `$${i}` + strings[i];
        }
        const res = await client.query(text, values);
        return res;
      },
      release: () => client.release()
    };
  }
};
