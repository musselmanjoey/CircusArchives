import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { ApiResponse } from '@/types';

interface UserSearchResult {
  id: string;
  firstName: string;
  lastName: string;
}

// GET /api/users - Search users by name
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    // Search users by first name or last name containing the query
    const users = await prisma.user.findMany({
      where: query
        ? {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {},
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      take: 20,
    });

    return NextResponse.json<ApiResponse<UserSearchResult[]>>({
      data: users,
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user (for performer tagging)
export async function POST(request: NextRequest) {
  try {
    // Require authentication to create performers
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { firstName, lastName } = body;

    if (!firstName || !lastName) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists with this name
    const existingUser = await prisma.user.findFirst({
      where: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      },
    });

    if (existingUser) {
      return NextResponse.json<ApiResponse<UserSearchResult>>({
        data: {
          id: existingUser.id,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
        },
      });
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    return NextResponse.json<ApiResponse<UserSearchResult>>(
      { data: user },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
