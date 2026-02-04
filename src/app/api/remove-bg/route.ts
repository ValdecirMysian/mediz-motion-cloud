import { NextRequest, NextResponse } from 'next/server';

const REMBG_API_URL = 'https://mediz.digital/rembg-api-endpoint/';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Create a new FormData for the external request
    const externalFormData = new FormData();
    externalFormData.append('image', file); // The PHP script expects 'image'

    // Call the external API
    const response = await fetch(REMBG_API_URL, {
      method: 'POST',
      body: externalFormData,
      // Note: fetch automatically sets the Content-Type header for FormData with boundary
    });

    if (!response.ok) {
      console.error('External API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `External API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the image blob
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return the image
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error in remove-bg proxy:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
