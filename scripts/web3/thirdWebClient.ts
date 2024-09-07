import { createThirdwebClient, ThirdwebClient } from "thirdweb";
import { upload, download, unpin } from "thirdweb/storage";

let thirdwebClient: ThirdwebClient;

export async function uploadFile(content: string): Promise<string> {
  return await upload({
    client: thirdwebClient,
    files: [new File([content], "d.txt")],
  });
}

export async function downloadFile(uri: string): Promise<string> {
  const file = await download({
    client: thirdwebClient,
    uri,
  });

  return await file.text();
}

export function deleteFile(uri: string): Promise<void> {
  return unpin({
    client: thirdwebClient,
    cid: uri.match(/ipfs:\/\/([^\/]+)/)[1],
  });
}

export default async function init(secretKey: string) {
  thirdwebClient = createThirdwebClient({
    secretKey,
  });
}
