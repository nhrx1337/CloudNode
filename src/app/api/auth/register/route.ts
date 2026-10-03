import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, username } = body as {
      email?: unknown;
      password?: unknown;
      username?: unknown;
    };

    if (typeof email !== "string" || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    let name =
      typeof username === "string" ? username.trim() : "";
    if (name.length < 2 || name.length > 40) {
      name = email.split("@")[0].slice(0, 40) || "member";
    }

    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(usersTable)
      .values({ email, password: hashedPassword, username: name })
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        username: usersTable.username,
      });

    return NextResponse.json(
      { message: "Account created. Please sign in.", user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}