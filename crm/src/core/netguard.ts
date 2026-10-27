import dns from "node:dns/promises";
import net from "node:net";

// SSRF guard for anything an admin can point the server at (webhook URLs, IMAP hosts).
// Private/loopback/link-local targets are refused unless the matching env flag is set (dev, tests, on-prem mail servers).
export function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:127.") || v.startsWith("::ffff:10.") || v.startsWith("::ffff:192.168.");
}

export async function assertPublicHost(rawHost: string, allowFlag: string) {
  if (process.env[allowFlag] === "1") return;
  const host = rawHost.replace(/^\[|\]$/g, "");
  const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
  if (addrs.some((a) => isPrivateIp(a.address))) throw new Error("The address points to a private or internal network");
}
