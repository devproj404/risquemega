import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  name: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';
}

export async function getAdminSession(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (!token) {
      return null;
    }

    const session = await prisma.adminSession.findUnique({
      where: { token },
      include: { admin: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return {
      id: session.admin.id,
      username: session.admin.username,
      email: session.admin.email,
      name: session.admin.name,
      role: session.admin.role,
    };
  } catch (error) {
    console.error('Get admin session error:', error);
    return null;
  }
}

export async function loginAdmin(
  emailOrUsername: string,
  password: string
): Promise<{ success: boolean; token?: string; error?: string; admin?: AdminUser }> {
  try {
    // Find admin by email or username
    const admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername },
        ],
      },
    });

    if (!admin) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Create session token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    // Create admin session in database
    await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        token,
        expiresAt,
      },
    });

    // Store token in cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    // Log admin login
    await prisma.activityLog.create({
      data: {
        action: 'ADMIN_LOGIN',
        userId: admin.id,
        username: admin.username,
        details: {
          role: admin.role,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  } catch (error) {
    console.error('Admin login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

export async function logoutAdmin(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (token) {
      // Delete session from database
      await prisma.adminSession.delete({
        where: { token },
      }).catch(() => {
        // Session might already be deleted, ignore error
      });

      // Get admin info for logging before deleting cookie
      const session = await prisma.adminSession.findUnique({
        where: { token },
        include: { admin: true },
      }).catch(() => null);

      if (session) {
        // Log admin logout
        await prisma.activityLog.create({
          data: {
            action: 'ADMIN_LOGOUT',
            userId: session.admin.id,
            username: session.admin.username,
            details: {
              role: session.admin.role,
              timestamp: new Date().toISOString(),
            },
          },
        }).catch(() => {
          // Ignore logging errors
        });
      }
    }

    // Delete cookie
    cookieStore.delete('admin_session');
  } catch (error) {
    console.error('Admin logout error:', error);
    // Still delete the cookie even if there's an error
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');
  }
}

function generateToken(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}
