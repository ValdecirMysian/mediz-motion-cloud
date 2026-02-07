import { db } from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Usando db.sql direto para evitar leak de conexão
    
    // Tenta criar a tabela novamente para garantir
    await db.sql`
      CREATE TABLE IF NOT EXISTS templates (
        id VARCHAR(255) PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Tenta fazer um select simples
    const result = await db.sql`SELECT count(*) FROM templates`;

    return NextResponse.json({  
      status: 'ok', 
      message: 'Conexão bem sucedida e tabela verificada',
      count: result.rows[0].count,
      env_check: {
        has_postgres_url: !!process.env.POSTGRES_URL,
        has_database_url: !!process.env.DATABASE_URL,
        node_env: process.env.NODE_ENV
      }
    });

  } catch (error: any) {
    console.error('Erro de conexão/migração:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message,
      detail: JSON.stringify(error),
      env_check: {
        has_postgres_url: !!process.env.POSTGRES_URL,
        has_database_url: !!process.env.DATABASE_URL,
        node_env: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
}
