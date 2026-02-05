import { db } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const client = await db.connect();
    
    // Cria a tabela se não existir
    await client.sql`
      CREATE TABLE IF NOT EXISTS templates (
        id VARCHAR(255) PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    return NextResponse.json({ message: 'Tabela templates criada/verificada com sucesso' });
  } catch (error) {
    console.error('Erro na migração:', error);
    return NextResponse.json({ error: 'Falha na migração' }, { status: 500 });
  }
}
