// hoodiecrow-imap (a scriptable IMAP server used only by the tests) ships no types.
declare module "hoodiecrow-imap" {
  const hoodiecrow: (options: Record<string, unknown>) => {
    listen(port: number, host: string, cb: () => void): void;
    close(): void;
    server?: { address(): { port: number } };
    address?(): { port: number };
  };
  export default hoodiecrow;
}
