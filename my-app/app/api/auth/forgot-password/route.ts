import { NextRequest, NextResponse } from 'next/server';
import { getSecurityQuestionsForReset } from '../../../../lib/db-queries';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || email.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const { pubguid, questions } = await getSecurityQuestionsForReset(email);

    return NextResponse.json({
      success: true,
      pubguid,
      questions
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve security questions';
    
    if (errorMessage.includes('Invalid email address')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}