import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface VulnerabilityResult {
  name: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: string;
  remediation: string;
  ai_explanation: string;
  evidence: Record<string, unknown>;
}

// Security headers that should be present
const SECURITY_HEADERS = [
  {
    header: "strict-transport-security",
    name: "Missing HSTS Header",
    severity: "high" as const,
    description:
      "The Strict-Transport-Security (HSTS) header is not set. This allows attackers to perform protocol downgrade attacks and cookie hijacking.",
    remediation:
      'Add the header: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
    ai_explanation:
      "Without HSTS, users connecting via HTTP can be intercepted by attackers performing man-in-the-middle attacks. The attacker can strip the TLS connection and serve content over plain HTTP, potentially stealing credentials or session tokens. This is known as an SSL stripping attack.",
  },
  {
    header: "content-security-policy",
    name: "Missing Content Security Policy",
    severity: "high" as const,
    description:
      "No Content-Security-Policy header found. This makes the site vulnerable to XSS and data injection attacks.",
    remediation:
      "Implement a CSP header that restricts script sources. Start with: Content-Security-Policy: default-src 'self'; script-src 'self'",
    ai_explanation:
      "CSP is your primary defense against Cross-Site Scripting (XSS). Without it, an attacker who finds an injection point can execute arbitrary JavaScript in users' browsers, leading to session hijacking, data theft, or defacement.",
  },
  {
    header: "x-content-type-options",
    name: "Missing X-Content-Type-Options",
    severity: "medium" as const,
    description:
      "The X-Content-Type-Options header is not set. Browsers may MIME-sniff the response, potentially interpreting content incorrectly.",
    remediation: "Add the header: X-Content-Type-Options: nosniff",
    ai_explanation:
      "MIME sniffing can cause the browser to interpret a non-executable file (like a text file) as executable, enabling attacks where an attacker uploads a disguised malicious file.",
  },
  {
    header: "x-frame-options",
    name: "Missing X-Frame-Options",
    severity: "medium" as const,
    description:
      "The X-Frame-Options header is not set. The site can be embedded in iframes, making it vulnerable to clickjacking attacks.",
    remediation: "Add the header: X-Frame-Options: DENY or SAMEORIGIN",
    ai_explanation:
      "Without this header, an attacker can embed your site in a transparent iframe on a malicious page. Users think they are interacting with the attacker's page but are actually clicking on your site — potentially changing account settings, transferring funds, or granting permissions.",
  },
  {
    header: "x-xss-protection",
    name: "Missing X-XSS-Protection",
    severity: "low" as const,
    description:
      "The X-XSS-Protection header is not set. While modern browsers have built-in XSS filters, this header provides an additional layer.",
    remediation: "Add the header: X-XSS-Protection: 1; mode=block",
    ai_explanation:
      "This header tells the browser to block the page if it detects a reflected XSS attack. While CSP is the primary defense, this provides defense-in-depth for older browsers.",
  },
  {
    header: "referrer-policy",
    name: "Missing Referrer-Policy",
    severity: "low" as const,
    description:
      "No Referrer-Policy header found. The site may leak sensitive URL information to third parties.",
    remediation:
      "Add the header: Referrer-Policy: strict-origin-when-cross-origin",
    ai_explanation:
      "Without a referrer policy, the full URL (including query parameters that might contain tokens or sensitive data) is sent to external sites. This can leak session tokens, search queries, or other private information.",
  },
  {
    header: "permissions-policy",
    name: "Missing Permissions-Policy",
    severity: "low" as const,
    description:
      "No Permissions-Policy header found. Browser features like camera, microphone, and geolocation are not restricted.",
    remediation:
      'Add the header: Permissions-Policy: camera=(), microphone=(), geolocation=()',
    ai_explanation:
      "The Permissions-Policy header controls which browser features the page can use. Without it, embedded content (ads, iframes) could access sensitive device features like the camera or microphone without the user's knowledge.",
  },
];

// Cookie security checks
function checkCookies(cookieHeader: string | null): VulnerabilityResult[] {
  const vulns: VulnerabilityResult[] = [];

  if (cookieHeader) {
    const cookies = cookieHeader.split(",").map((c) => c.trim());

    for (const cookie of cookies) {
      const cookieName = cookie.split("=")[0]?.trim();
      if (!cookieName) continue;

      if (!cookie.toLowerCase().includes("httponly")) {
        vulns.push({
          name: `Cookie "${cookieName}" Missing HttpOnly Flag`,
          description: `The cookie "${cookieName}" does not have the HttpOnly flag, making it accessible to JavaScript.`,
          severity: "medium",
          category: "cookies",
          remediation:
            "Set the HttpOnly flag on all sensitive cookies to prevent JavaScript access.",
          ai_explanation:
            "Without HttpOnly, cookies are accessible via document.cookie in JavaScript. If an XSS vulnerability exists, an attacker can steal session cookies and hijack user accounts.",
          evidence: { cookie: cookieName },
        });
      }

      if (!cookie.toLowerCase().includes("secure")) {
        vulns.push({
          name: `Cookie "${cookieName}" Missing Secure Flag`,
          description: `The cookie "${cookieName}" does not have the Secure flag, allowing transmission over HTTP.`,
          severity: "medium",
          category: "cookies",
          remediation:
            "Set the Secure flag on all cookies to ensure they are only sent over HTTPS.",
          ai_explanation:
            "Without the Secure flag, cookies can be sent over unencrypted HTTP connections, allowing attackers on shared networks to intercept and steal session cookies.",
          evidence: { cookie: cookieName },
        });
      }
    }
  }

  return vulns;
}

// Technology detection
function detectTechnologies(
  headers: Record<string, string>,
  body: string
): string[] {
  const techs: string[] = [];

  // Server header
  const server = headers["server"];
  if (server) techs.push(`Server: ${server}`);

  // X-Powered-By
  const poweredBy = headers["x-powered-by"];
  if (poweredBy) techs.push(`Powered by: ${poweredBy}`);

  // Body-based detection
  if (body.includes("wp-content") || body.includes("wordpress"))
    techs.push("WordPress");
  if (body.includes("react") || body.includes("__NEXT"))
    techs.push("React/Next.js");
  if (body.includes("angular")) techs.push("Angular");
  if (body.includes("vue")) techs.push("Vue.js");
  if (body.includes("jquery") || body.includes("jQuery"))
    techs.push("jQuery");
  if (body.includes("bootstrap")) techs.push("Bootstrap");
  if (body.includes("tailwind")) techs.push("Tailwind CSS");
  if (body.includes("cloudflare")) techs.push("Cloudflare");

  return [...new Set(techs)];
}

// Calculate security score
function calculateScore(vulnerabilities: VulnerabilityResult[]): number {
  let score = 100;

  for (const vuln of vulnerabilities) {
    switch (vuln.severity) {
      case "critical":
        score -= 20;
        break;
      case "high":
        score -= 12;
        break;
      case "medium":
        score -= 6;
        break;
      case "low":
        score -= 3;
        break;
      case "info":
        score -= 1;
        break;
    }
  }

  return Math.max(0, Math.min(100, score));
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
      if (!["http:", "https:"].includes(targetUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format. Please include http:// or https://" },
        { status: 400 }
      );
    }

    const vulnerabilities: VulnerabilityResult[] = [];
    const responseHeaders: Record<string, string> = {};
    let responseBody = "";
    let cookieHeader: string | null = null;

    // Fetch the target URL
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(targetUrl.toString(), {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "BugHunter-AI-Scanner/1.0",
        },
      });

      clearTimeout(timeout);

      // Collect headers
      response.headers.forEach((value, key) => {
        responseHeaders[key.toLowerCase()] = value;
      });

      cookieHeader = response.headers.get("set-cookie");
      responseBody = await response.text();

      // Check if HTTPS
      if (targetUrl.protocol === "http:") {
        vulnerabilities.push({
          name: "No HTTPS Encryption",
          description:
            "The website is served over unencrypted HTTP. All data transmitted between the browser and server can be intercepted.",
          severity: "critical",
          category: "ssl",
          remediation:
            "Configure your web server to use HTTPS with a valid SSL/TLS certificate. Free certificates are available from Let's Encrypt.",
          ai_explanation:
            "Without HTTPS, all communication between the user's browser and your server is in plain text. Attackers on the same network can read passwords, session cookies, and personal data. This is especially dangerous on public WiFi networks.",
          evidence: { protocol: "http" },
        });
      }

      // Check security headers
      for (const check of SECURITY_HEADERS) {
        if (!responseHeaders[check.header]) {
          vulnerabilities.push({
            name: check.name,
            description: check.description,
            severity: check.severity,
            category: "headers",
            remediation: check.remediation,
            ai_explanation: check.ai_explanation,
            evidence: { missing_header: check.header },
          });
        }
      }

      // Check cookie security
      const cookieVulns = checkCookies(cookieHeader);
      vulnerabilities.push(...cookieVulns);

      // Check for information exposure
      if (responseHeaders["server"]) {
        vulnerabilities.push({
          name: "Server Version Disclosure",
          description: `The server header reveals: "${responseHeaders["server"]}". This information can help attackers target known vulnerabilities.`,
          severity: "info",
          category: "info_exposure",
          remediation:
            "Remove or obfuscate the Server header to avoid revealing your server software and version.",
          ai_explanation:
            "Server version disclosure gives attackers a starting point. If they know you're running Apache 2.4.49, for example, they can look up CVEs specifically for that version and craft targeted exploits.",
          evidence: { server: responseHeaders["server"] },
        });
      }

      if (responseHeaders["x-powered-by"]) {
        vulnerabilities.push({
          name: "Technology Stack Disclosure",
          description: `The X-Powered-By header reveals: "${responseHeaders["x-powered-by"]}". This exposes your backend technology.`,
          severity: "low",
          category: "info_exposure",
          remediation:
            "Remove the X-Powered-By header from your server configuration.",
          ai_explanation:
            "Revealing your backend framework (e.g., Express, PHP) helps attackers narrow down which exploits to try. It's a low-effort fix that removes an easy reconnaissance vector.",
          evidence: { poweredBy: responseHeaders["x-powered-by"] },
        });
      }
    } catch (fetchError: unknown) {
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timed out. The website took too long to respond." },
          { status: 408 }
        );
      }
      return NextResponse.json(
        {
          error: `Could not reach the website: ${fetchError instanceof Error ? fetchError.message : "Unknown error"}`,
        },
        { status: 502 }
      );
    }

    // Detect technologies
    const technologies = detectTechnologies(responseHeaders, responseBody);

    // Calculate score
    const securityScore = calculateScore(vulnerabilities);
    const scanDuration = Date.now() - startTime;

    // Save to database
    let scanId: string | undefined;
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Create scan record
        const { data: scan } = await supabase
          .from("scans")
          .insert({
            user_id: user.id,
            target_url: targetUrl.toString(),
            security_score: securityScore,
            status: "completed",
            scan_duration_ms: scanDuration,
            headers_checked: responseHeaders,
            technologies: technologies,
          })
          .select()
          .single();

        if (scan) {
          scanId = scan.id;

          // Save vulnerabilities
          if (vulnerabilities.length > 0) {
            await supabase.from("vulnerabilities").insert(
              vulnerabilities.map((v) => ({
                scan_id: scan.id,
                name: v.name,
                description: v.description,
                severity: v.severity,
                category: v.category,
                remediation: v.remediation,
                ai_explanation: v.ai_explanation,
                evidence: v.evidence,
              }))
            );
          }
        }
      }
    } catch (dbError) {
      console.error("Database save error:", dbError);
      // Continue — return results even if DB save fails
    }

    return NextResponse.json({
      id: scanId,
      target_url: targetUrl.toString(),
      security_score: securityScore,
      vulnerabilities,
      headers_checked: responseHeaders,
      technologies,
      scan_duration_ms: scanDuration,
    });
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json(
      { error: "An internal error occurred during the scan" },
      { status: 500 }
    );
  }
}
