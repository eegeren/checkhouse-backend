import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: { code: "bad_request", message } }, { status: 400 });
}

export function unauthorized(message = "Authentication required.") {
  return NextResponse.json({ error: { code: "unauthorized", message } }, { status: 401 });
}

export function forbidden(message: string) {
  return NextResponse.json({ error: { code: "forbidden", message } }, { status: 403 });
}

export function serverError(message = "Unexpected server error.") {
  return NextResponse.json({ error: { code: "server_error", message } }, { status: 500 });
}
