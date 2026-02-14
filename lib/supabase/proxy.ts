import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// This function is no longer used since we migrated from global middleware
// to route-level authentication in Next.js 15+
