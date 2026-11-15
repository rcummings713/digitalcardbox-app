type Challenge = (csrfToken: string) => Promise<boolean>;
let challenge: Challenge | undefined;

export function registerReauthenticationChallenge(next: Challenge) {
  challenge = next;
  return () => {
    if (challenge === next) challenge = undefined;
  };
}

export function requestReauthentication(csrfToken?: string | null) {
  return csrfToken && challenge ? challenge(csrfToken) : Promise.resolve(false);
}
