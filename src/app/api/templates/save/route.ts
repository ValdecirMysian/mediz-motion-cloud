import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function POST(req: NextRequest) {
  try {
    const template = await req.json();
    
    if (!template.id || !template.nome) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // ========================================================================
    // SALVAR NO BANCO DE DADOS (POSTGRES)
    // ========================================================================
    
    const client = await db.connect();

    // Verifica se já existe para fazer update ou insert
    const existing = await client.sql`SELECT id FROM templates WHERE id = ${template.id}`;

    if (existing.rows.length > 0) {
      // Update
      await client.sql`
        UPDATE templates 
        SET nome = ${template.nome}, data = ${JSON.stringify(template)}, updated_at = NOW()
        WHERE id = ${template.id}
      `;
    } else {
      // Insert
      await client.sql`
        INSERT INTO templates (id, nome, data)
        VALUES (${template.id}, ${template.nome}, ${JSON.stringify(template)})
      `;
    }

    return NextResponse.json({ 
      success: true, 
      id: template.id
    });

  } catch (error) {
    console.error('Erro ao salvar template:', error);
    return NextResponse.json({ error: 'Erro interno ao salvar template' }, { status: 500 });
  }
}
