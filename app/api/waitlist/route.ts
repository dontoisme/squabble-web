import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const INVITE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
  }
  return code;
}

function deriveGuildName(email: string): string {
  const local = email.split('@')[0];
  // Capitalize first letter
  const name = local.charAt(0).toUpperCase() + local.slice(1);
  return `${name}'s Guild`;
}

async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function POST(request: NextRequest) {
  try {
    const { email, platform, source, referredByGuildId } = await request.json();

    if (!email || !platform) {
      return NextResponse.json(
        { error: 'Email and platform are required' },
        { status: 400 },
      );
    }

    const normalized = email.toLowerCase().trim();
    const emailHash = await hashEmail(normalized);

    // Check if already on waitlist
    const waitlistRef = adminDb.collection('waitlist').doc(emailHash);
    const existing = await waitlistRef.get();

    if (existing.exists) {
      const data = existing.data()!;
      return NextResponse.json({
        alreadyExists: true,
        inviteCode: data.inviteCode || null,
        guildId: data.guildId || null,
        guildName: data.guildName || null,
      });
    }

    // If referred by an existing guild, just create the waitlist entry
    if (referredByGuildId) {
      await waitlistRef.set({
        email: normalized,
        platform,
        source,
        referredByGuildId,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Increment referral count on the guild (fire-and-forget)
      adminDb
        .collection('guilds')
        .doc(referredByGuildId)
        .update({ waitlistReferralCount: FieldValue.increment(1) })
        .catch(() => {});

      return NextResponse.json({
        referredByGuildId,
      });
    }

    // Create a new guild for this waitlist signup
    const inviteCode = generateInviteCode();
    const guildName = deriveGuildName(normalized);
    const guildRef = adminDb.collection('guilds').doc();

    const batch = adminDb.batch();

    batch.set(guildRef, {
      name: guildName,
      createdBy: 'waitlist',
      ownerId: 'waitlist',
      createdAt: FieldValue.serverTimestamp(),
      inviteCode,
      memberCount: 0,
      waitlistEmail: emailHash,
    });

    batch.set(waitlistRef, {
      email: normalized,
      platform,
      source,
      guildId: guildRef.id,
      guildName,
      inviteCode,
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({
      inviteCode,
      guildId: guildRef.id,
      guildName,
    });
  } catch (err) {
    console.error('[waitlist] Error:', err);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    );
  }
}
