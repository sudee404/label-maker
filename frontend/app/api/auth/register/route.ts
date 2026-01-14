import api from '@/lib/axios';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    await api.post('/accounts/register/', {
      email,
      password,
      full_name:name,
    });

    return NextResponse.json(
      { message: 'User registered successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    const status = error.response?.status || error.status || 500;
    const message =
      error.response?.data?.message ||
      error.message ||
      'Internal server error';

    return NextResponse.json({ message }, { status });
  }
}