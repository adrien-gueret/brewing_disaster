import { getKey, storeKey } from "../save";

let privateKey: string | null;
let publicKey: string | null;

async function hash(text: string): Promise<string> {
  const res = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return [...new Uint8Array(res)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

export async function getPublicKey(): Promise<string | null> {
  if (publicKey) {
    return publicKey;
  }

  if (!privateKey) {
    return null;
  }

  publicKey = await hash(privateKey);

  return publicKey;
}

export const setPrivateKey = async (newKey: string) => {
  storeKey("privateKey", newKey);
  privateKey = newKey;

  if (!privateKey) {
    publicKey = null;
  } else {
    await getPublicKey();
  }

  return privateKey;
};

export async function generateNewPrivateKey(): Promise<string> {
  const newPrivateKey = crypto.randomUUID();

  return await setPrivateKey(newPrivateKey);
}

export default async function init(): Promise<string | null> {
  return setPrivateKey(getKey("privateKey") as string | null);
}
