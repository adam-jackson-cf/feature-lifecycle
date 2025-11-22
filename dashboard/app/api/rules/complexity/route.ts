import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type NextRequest, NextResponse } from 'next/server';

const configPath = join(process.cwd(), 'config', 'complexity.config.json');

export async function GET() {
  try {
    const config = JSON.parse(readFileSync(configPath, { encoding: 'utf-8' }));
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching complexity config:', error);
    return NextResponse.json({ error: 'Failed to fetch complexity config' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate structure (basic validation)
    if (!body.dimensions || !body.sizeBuckets) {
      return NextResponse.json({ error: 'Invalid complexity config structure' }, { status: 400 });
    }

    writeFileSync(configPath, JSON.stringify(body, null, 2), { encoding: 'utf-8' });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating complexity config:', error);
    return NextResponse.json({ error: 'Failed to update complexity config' }, { status: 500 });
  }
}
