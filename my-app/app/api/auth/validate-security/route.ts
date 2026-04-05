import { NextRequest, NextResponse } from 'next/server';
import { validateSecurityAnswers } from '../../../../lib/db-queries';

export async function POST(request: NextRequest) {
  try {
    const { pubguid, answer1, answer2 } = await request.json();

    if (!pubguid || !answer1 || !answer2) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await validateSecurityAnswers(pubguid, answer1, answer2);

    return NextResponse.json({
      success: true,
      message: 'Security questions validated successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to validate security answers';
    
    if (errorMessage.includes('validation failed')) {
      return NextResponse.json(
        { error: 'This security answer does not match' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}