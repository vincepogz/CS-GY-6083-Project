import { NextRequest, NextResponse } from 'next/server';
import { updatePassword } from '../../../../lib/db-queries';

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword, confirmPassword } = await request.json();

    if (!email || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await updatePassword(email, newPassword);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}