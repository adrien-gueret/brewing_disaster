import { createThirdwebClient } from "thirdweb";
import { upload, download } from "thirdweb/storage";

const client = createThirdwebClient({
  clientId: "e6055df8ecbdb81d15de36c429b52ce8",
});

console.log(client);

const uri = "ipfs://QmNxvA5bwvPGgMXbmtyhxA1cKFdvQXnsGnZLCGor3AzYxJ/hello.txt";

(async () => {
  /*
  const uris = await upload({
    client,
    files: [new File(["hello world"], "hello.txt")],
  });

  console.log(uris);
  */

  const file = await download({
    client,
    uri,
  });

  console.log(await file.text());
})();

let privateKey = localStorage.getItem("brewing-disaster-private-key");

/*
function setPrivateKey(newKey) {
  privateKey = newKey;
  localStorage.setItem("brewing-disaster-private-key", newKey);
  privateKeyShow.value = newKey;
}

async function hash(text) {
  const res = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder("utf-8").encode(text)
  );
  return [...new Uint8Array(res)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

async function getPublicKey() {
  if (!privateKey) {
    return null;
  }

  return hash(privateKey);
}

async function requestThirdWeb(
  endPoint,
  requestOptions = {},
  requestHeaders = {},
  expectJSON = true
) {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization:
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJkNWJhZWIwNy0yNjczLTQzNDYtYTFiMS02MmNjODhiOTA0Y2QiLCJlbWFpbCI6ImFkcmllbi5ncnRAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siaWQiOiJGUkExIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9LHsiaWQiOiJOWUMxIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjU3YjdlZjEzMjdlNGZkZTQ3M2VkIiwic2NvcGVkS2V5U2VjcmV0IjoiNTRlMzQ1ZGM3NzRiYmRlZWU2NjcxOTI4OGQwZjQwNzQ2YzFjMDUwMDc3ZjViYWVlZjkyMjA3NWZkNTI2NWZhYiIsImlhdCI6MTY5Mzk1MTk1Nn0.tAemHsE6EWZXpmzk-7pCGPH5uRzchmgiUoIJzaw9Y7E",
      ...requestHeaders,
    },
    ...requestOptions,
  };

  const response = await fetch("https://api.pinata.cloud" + endPoint, options);
  return expectJSON ? response.json() : response.text();
}

async function listFiles() {
  const publicKey = await getPublicKey();
  const files = await requestPinata(
    "/data/pinList?status=pinned&metadata[name]=Number Knight&metadata[keyvalues][authorPublicKey]=" +
      JSON.stringify({
        value: publicKey,
        op: "eq",
      })
  );

  return files;
}

function deleteFile(fileId) {
  return requestPinata(
    "/pinning/unpin/" + fileId,
    {
      method: "DELETE",
    },
    {},
    false
  );
}

async function saveOnPinata(levelName, levelCode) {
  if (!levelCode) {
    throw new Error("No level code");
  }
  const file = new File([levelCode], "number-knight-levels.txt", {
    type: "text/plain",
  });

  const formData = new FormData();

  formData.append("file", file);

  const authorPublicKey = await getPublicKey();

  const metadata = JSON.stringify({
    name: "Number Knight - " + levelName,
    keyvalues: {
      authorPublicKey,
      levelCode,
      levelName,
    },
  });
  formData.append("pinataMetadata", metadata);

  const options = JSON.stringify({
    cidVersion: 0,
    wrapWithDirectory: false,
  });
  formData.append("pinataOptions", options);

  const response = await requestPinata("/pinning/pinFileToIPFS", {
    method: "POST",
    body: formData,
  });

  return response;
}

const cancelAction = () => {
  if (window.opener) {
    window.close();
  } else {
    window.location.href = "./";
  }
};

cancelButton.onclick = cancelAction;

async function showLevelList() {
  levelList.innerHTML = "";
  window.location.hash = "";
  const levels = await listFiles();

  if (levels.count === 0) {
    yourLevelList.classList.add("no-level");
  } else {
    totalSaved.innerHTML = `You have saved <b>${levels.count}</b> level${
      levels.count > 1 ? "s" : ""
    }.<br /><small><em>It may take some times to update this list, if something feels wrong try to refresh it!</em></small>`;
    const menuFragment = document.createDocumentFragment();

    const allLevelCodes = [];

    const rootURL = window.opener
      ? "https://js13kgames.com/games/number-knight/index.html"
      : window.location.origin;

    levels.rows.forEach((level, i) => {
      if (!level.metadata.keyvalues.levelCode) {
        return;
      }
      const link = document.createElement("button");
      link.type = "button";
      const small = document.createElement("small");
      small.textContent = level.metadata.keyvalues.levelName;
      link.append(small);
      link.className = "button";

      link.onclick = (e) => {
        e.preventDefault();
        levelDetailsName.textContent = level.metadata.keyvalues.levelName;

        const levelURL = `${rootURL}?p=${level.metadata.keyvalues.levelCode}`;
        levelDetailsPlayLink.href = levelURL;
        levelDetailsCode.value = levelURL;

        levelDetailsDelete.onclick = async (e) => {
          e.preventDefault();
          await deleteFile(level.ipfs_pin_hash);

          window.setTimeout(async () => {
            await showLevelList();
            levelDetailsDialog.close();
          }, 300);
        };

        levelDetailsDialog.showModal();
      };

      allLevelCodes.unshift(level.metadata.keyvalues.levelCode);

      menuFragment.append(link);
    });

    allLevelsLink.value = `${rootURL}?p=${allLevelCodes.join("&p=")}`;
    levelList.append(menuFragment);
    yourLevelList.classList.remove("no-level");
  }

  yourLevelList.showModal();
}

function goToSaveOrLevelList() {
  if (wantToSaveLevel) {
    saveLevelDialog.showModal();
  } else {
    showLevelList();
  }
}

//reloadLevelsButton.onclick = showLevelList;

generateKeyButton.onclick = () => {
  setPrivateKey(crypto.randomUUID());
  privateKeyDialog.close();
  showPrivateKeyDialog.showModal();
};

privateKeyDialog.onclose = (e) => {
  if (e.target.returnValue === "submit") {
    setPrivateKey(privateKeyInput.value);
    goToSaveOrLevelList();
  }
};

showPrivateKeyDialog.onclose = goToSaveOrLevelList;

if (!privateKey) {
  privateKeyDialog.showModal();
} else {
  goToSaveOrLevelList();
}
*/
