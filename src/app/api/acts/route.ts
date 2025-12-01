import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { ApiResponse, Act } from '@/types';

export async function GET() {
  try {
    const acts = await prisma.act.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json<ApiResponse<Act[]>>({ data: acts as Act[] });
  } catch (error) {
    console.error('Error fetching acts:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to fetch acts' },
      { status: 500 }
    );
  }
}
