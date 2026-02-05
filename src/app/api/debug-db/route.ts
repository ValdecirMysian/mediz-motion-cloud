import { db } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const client = await db.connect();
    
    // Tenta criar a tabela novamente para garantir
    await client.sql`
      CREATE TABLE IF NOT EXISTS templates (
        id VARCHAR(255) PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Tenta fazer um select simples
    const result = await client.sql`SELECT count(*) FROM templates`;

    return NextResponse.json({ 
      status: 'ok', 
      message: 'Conexão bem sucedida e tabela verificada',
      count: result.rows[0].count 
    });

  } catch (error: any) {
    console.error('Erro de conexão/migração:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message,
      detail: JSON.stringify(error)
    }, { status: 500 });
  }
}
