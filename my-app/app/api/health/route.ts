import { NextResponse } from 'next/server';
import { pool, isDatabaseConfigured } from '../../../lib/supabase';

interface TableCheck {
  table: string;
  exists: boolean;
  error?: string;
}

export async function GET() {
  try {
    // Check if database is configured
    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        connectionStatus: 'failed',
        message: 'Database not configured'
      }, { status: 500 });
    }

    // Test connection
    await pool.query('SELECT COUNT(*) FROM account LIMIT 1');

    // Check tables
    const tablesToCheck = ['account', 'identity', 'login', 'membership', 'security'];
    const tableChecks: TableCheck[] = [];

    for (const table of tablesToCheck) {
      try {
        await pool.query(`SELECT * FROM ${table} LIMIT 1`);
        tableChecks.push({ table, exists: true });
      } catch (error) {
        const err = error as any;
        if (err.code === '42P01' || err.message?.includes('does not exist')) {
          tableChecks.push({ table, exists: false });
        } else {
          tableChecks.push({ table, exists: false, error: err.message });
        }
      }
    }

    return NextResponse.json({
      connectionStatus: 'connected',
      tableChecks
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      connectionStatus: 'failed',
      message: 'Connection test failed',
      error: (error as Error).message
    }, { status: 500 });
  }
}