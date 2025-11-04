import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin, AVATARS_BUCKET } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG and PNG are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.type === 'image/jpeg' ? 'jpg' : 'png';
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(AVATARS_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(AVATARS_BUCKET)
      .getPublicUrl(filePath);

    // Delete old avatar from storage if exists
    if (user.avatar && user.avatar.includes(AVATARS_BUCKET)) {
      try {
        const oldPath = user.avatar.split(`/${AVATARS_BUCKET}/`)[1];
        if (oldPath) {
          await supabaseAdmin.storage.from(AVATARS_BUCKET).remove([oldPath]);
        }
      } catch (err) {
        console.error('Failed to delete old avatar:', err);
        // Don't fail the request if old avatar deletion fails
      }
    }

    // Update user avatar in database
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: urlData.publicUrl },
    });

    return NextResponse.json({
      message: 'Avatar updated successfully',
      avatar: urlData.publicUrl,
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}
