import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Invalid email or password format." },
        { status: 400 }
      );
    }

    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    const invalidCredentialsError = NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );

    if (existingUser.length === 0) {
      return invalidCredentialsError;
    }

    const user = existingUser[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return invalidCredentialsError;
    }

    const token = await signToken({ userId: user.id, email: user.email });

    const response = NextResponse.json(
      {
        message: "Login successful.",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      },
      { status: 200 }
    );

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 day
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Unhandled exception during user authentication:", error);
    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}
