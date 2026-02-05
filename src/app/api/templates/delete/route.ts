import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do template não fornecido' }, { status: 400 });
    }

    const client = await db.connect();

    // Deleta do banco
    const result = await client.sql`
      DELETE FROM templates WHERE id = ${id}
    `;

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro ao deletar template:', error);
    return NextResponse.json({ error: 'Erro interno ao deletar template' }, { status: 500 });
  }
}
