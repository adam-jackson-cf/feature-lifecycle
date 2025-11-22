import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type NextRequest, NextResponse } from 'next/server';

const configPath = join(process.cwd(), 'config', 'discipline-rules.json');

export async function GET() {
  try {
    const rules = JSON.parse(readFileSync(configPath, { encoding: 'utf-8' }));
    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error fetching discipline rules:', error);
    return NextResponse.json({ error: 'Failed to fetch discipline rules' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate structure (basic validation)
    if (!body.rules || !Array.isArray(body.rules)) {
      return NextResponse.json({ error: 'Invalid discipline rules structure' }, { status: 400 });
    }

    writeFileSync(configPath, JSON.stringify(body, null, 2), { encoding: 'utf-8' });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating discipline rules:', error);
    return NextResponse.json({ error: 'Failed to update discipline rules' }, { status: 500 });
  }
}
