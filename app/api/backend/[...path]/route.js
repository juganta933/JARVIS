import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  return handleProxy(request, await params, "GET");
}

export async function POST(request, { params }) {
  return handleProxy(request, await params, "POST");
}

export async function PATCH(request, { params }) {
  return handleProxy(request, await params, "PATCH");
}

export async function DELETE(request, { params }) {
  return handleProxy(request, await params, "DELETE");
}

async function handleProxy(request, params, method) {
  const pathParts = params?.path || [];
  const endpoint = "/" + pathParts.join("/");
  
  // URL search params
  const urlObj = new URL(request.url);
  const search = urlObj.search;

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");
  const targetUrl = `${baseUrl}${endpoint}${search}`;

  // Forward headers (cookies, auth, content-type)
  const forwardHeaders = new Headers();
  const allowedHeaders = ["cookie", "content-type", "x-api-key", "x-app-id", "authorization"];
  
  for (const [key, value] of request.headers.entries()) {
    if (allowedHeaders.includes(key.toLowerCase())) {
      forwardHeaders.set(key, value);
    }
  }

  let body = undefined;
  if (method !== "GET" && method !== "HEAD") {
    try {
      body = await request.text();
    } catch {
      // no body
    }
  }

  try {
    const res = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body: body && body.length > 0 ? body : undefined,
      cache: "no-store",
    });

    const responseBody = await res.text();
    const headers = new Headers();
    
    // Forward relevant response headers, especially Set-Cookie
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        headers.append("set-cookie", value);
      } else if (key.toLowerCase() === "content-type") {
        headers.set(key, value);
      }
    });

    return new NextResponse(responseBody, {
      status: res.status,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to connect to backend at ${baseUrl}: ${error.message}`,
        details: "Check if the server is running and accessible.",
      },
      { status: 502 }
    );
  }
}
