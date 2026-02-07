import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET() {
  try {
    // Usamos db.sql direto para aproveitar o pool connection management (auto release)
    const result = await db.sql`
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
