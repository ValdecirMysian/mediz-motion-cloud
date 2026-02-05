import { NextResponse } from 'next/server';
import { db } from '@vercel/postgres';

export async function GET() {
  try {
    const client = await db.connect();
    
    // Busca todos os templates do banco
    // A coluna 'data' já contém o JSON completo do template
    const result = await client.sql`
      SELECT data FROM templates ORDER BY updated_at DESC
    `;
    
    // Extrai o objeto JSON de cada linha
    const templates = result.rows.map(row => row.data);

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Erro ao listar templates:', error);
    return NextResponse.json({ error: 'Erro ao listar templates' }, { status: 500 });
  }
}
