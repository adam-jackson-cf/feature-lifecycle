import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const configDir = join(process.cwd(), 'config');

export async function GET() {
  try {
    const complexityPath = join(configDir, 'complexity.config.json');
    const disciplinePath = join(configDir, 'discipline-rules.json');

    if (!existsSync(complexityPath) || !existsSync(disciplinePath)) {
      return NextResponse.json({ error: 'Config files not found' }, { status: 404 });
    }

    const complexityConfig = JSON.parse(readFileSync(complexityPath, { encoding: 'utf-8' }));
    const disciplineRules = JSON.parse(readFileSync(disciplinePath, { encoding: 'utf-8' }));

    return NextResponse.json({
      complexity: complexityConfig,
      discipline: disciplineRules,
    });
  } catch (error) {
    console.error('Error fetching rules:', error);
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
}

const updateRulesSchema = z.object({
  complexity: z.record(z.string(), z.unknown()).optional(),
  discipline: z.record(z.string(), z.unknown()).optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = updateRulesSchema.parse(body);

    if (validatedData.complexity) {
      writeFileSync(
        join(configDir, 'complexity.config.json'),
        JSON.stringify(validatedData.complexity, null, 2),
        { encoding: 'utf-8' }
      );
    }

    if (validatedData.discipline) {
      writeFileSync(
        join(configDir, 'discipline-rules.json'),
        JSON.stringify(validatedData.discipline, null, 2),
        { encoding: 'utf-8' }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating rules:', error);
    return NextResponse.json({ error: 'Failed to update rules' }, { status: 500 });
  }
}
