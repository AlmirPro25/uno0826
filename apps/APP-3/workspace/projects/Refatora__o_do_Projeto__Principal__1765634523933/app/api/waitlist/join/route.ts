
// Next.js Route Handler for waitlist signup.
// This implements real data persistence using Prisma and a local SQLite database.

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Initialize Prisma Client
const prisma = new PrismaClient();

// Define validation schema using Zod for incoming request body
const waitlistSchema = z.object({
  email: z.string().email('E-mail inválido. Por favor, verifique o formato.'),
});

/**
 * Handles POST requests for joining the waitlist.
 * Validates email and persists it to the database.
 * @param {Request} req - The incoming request object.
 * @returns {Response} JSON response indicating success or failure.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Server-side validation with Zod
    const validationResult = waitlistSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ success: false, error: validationResult.error.errors[0].message }, { status: 400 });
    }

    const { email } = validationResult.data;

    // Sanitize data (optional but good practice, Zod handles most of it)
    const sanitizedEmail = email.toLowerCase().trim();

    // Check if email already exists in the waitlist (idempotency check)
    const existingEntry = await prisma.waitlistEntry.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingEntry) {
      // Return 409 Conflict if user already exists
      return NextResponse.json({ success: false, error: 'Este e-mail já está na lista de espera.' }, { status: 409 });
    }

    // Persist to database
    await prisma.waitlistEntry.create({
      data: { email: sanitizedEmail },
    });

    // Logging for observability
    console.log(`[WAITLIST ENTRY] Novo lead capturado: ${sanitizedEmail}`);

    return NextResponse.json({ success: true, message: 'Waitlist entry recorded.' }, { status: 201 });

  } catch (error) {
    console.error('[WAITLIST API ERROR]', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor. Por favor, tente novamente mais tarde.' }, { status: 500 });
  }
}
