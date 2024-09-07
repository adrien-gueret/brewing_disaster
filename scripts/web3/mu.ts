import { getPublicKey } from "./keys";
import { downloadFile, uploadFile, deleteFile } from "./thirdWebClient";

const ROOT = "https://www.mariouniversalis.fr/brewing-disaster/";

let thirdWebURI: string = "";
let deckContent: string = "";

export async function checkFile(fileId: string): Promise<boolean> {
  try {
    const response = await fetch(`${ROOT}${fileId}`, {
      method: "GET",
    });

    if (response.ok) {
      thirdWebURI = await response.text();

      if (thirdWebURI) {
        try {
          deckContent = await downloadFile(thirdWebURI);
        } catch (e) {
          thirdWebURI = "";
          deckContent = "";
          return true;
        }
      }
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

export function getDeckContent(): string {
  return deckContent;
}

export async function setFile(fileId: string, content: string): Promise<void> {
  try {
    const response = await fetch(`${ROOT}${fileId}`, {
      method: "PUT",
      body: content,
      headers: {
        "Content-Type": "text/plain",
      },
    });

    if (!response.ok) {
      throw new Error("Error while updating file");
    }
  } catch (error) {
    throw error;
  }
}

export async function setThirdwebURI(
  uri: string,
  publicKey: string
): Promise<string> {
  thirdWebURI = uri;

  await setFile(publicKey, uri);

  return uri;
}

export async function saveFile(fileContent: string[]): Promise<void> {
  const newFileContent = fileContent.join("\n");

  const newFileURI = await uploadFile(newFileContent);

  deckContent = newFileContent;

  if (thirdWebURI) {
    try {
      await deleteFile(thirdWebURI);
    } catch (e) {}
  }

  const publicKey = await getPublicKey();

  await setThirdwebURI(newFileURI, publicKey);
}
