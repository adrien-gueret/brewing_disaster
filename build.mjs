import fs, { writeFileSync } from "fs";
import { execSync } from "child_process";
import { minify } from "minify";
import { Packer } from "roadroller";
import { zip, COMPRESSION_LEVEL } from "zip-a-folder";

(async () => {
  console.log("Remove previous entry files...");
  fs.rmSync("./entry", { recursive: true, force: true });
  fs.rmSync("./entry.zip", { force: true });

  console.log("Get project files content...");

  let indexHTML = fs.readFileSync("./index.html", "utf8");

  let styleCSS = fs.readFileSync("./style.css", "utf8");

  let indexJS = fs
    .readFileSync("./index.js", "utf8")
    .replaceAll("const ", "let ")
    .replaceAll("undefined", "void 0");

  console.log("Minify JS...");
  const minifiedJS = await minify.js(indexJS);

  console.log("Minify CSS...");
  const minifiedCSS = await minify.css(styleCSS);

  console.log("Minify HTML...");

  const toBase64Url = (fileName) =>
    `data:image/png;base64,${fs.readFileSync(fileName, {
      encoding: "base64",
    })}`;

  indexHTML = indexHTML
    .replace(
      '<script type="module" src="scripts/index.js"></script>',
      () => `<script>${minifiedJS}</script>`
    )
    .replace(
      '<link href="./style.css" rel="stylesheet" />',
      () => `<style>${minifiedCSS}</style>`
    )
    .replaceAll("--primary-dark", "--pd")
    .replaceAll("--secondary-dark", "--sx")
    .replaceAll("--primary-light", "--pl")
    .replaceAll("--light-background", "--lb")
    .replaceAll("--lighter-background", "--leb")
    .replaceAll("--medium-background", "--mb")
    .replaceAll("--shadow", "--s")
    .replaceAll("--border", "--b")
    .replaceAll("--radius", "--r")
    .replaceAll("inlineLink", "il")
    .replaceAll("award-index", "ai")
    .replaceAll("withPassive", "wp")
    .replaceAll("poisonnedValue", "pv")
    .replaceAll("poisoned", "pd")
    .replaceAll("currentGame", "cg")
    .replaceAll("currentBattle", "cb")
    .replaceAll("botPassiveIds", "bp")
    .replaceAll("startPutridity", "sp")
    .replaceAll("isLocked", "il")
    .replaceAll('"player"', '"p"')
    .replaceAll('"opponent"', '"o"')
    .replaceAll("sectionTitle", "st")
    .replaceAll("footerInner", "fi")
    .replaceAll(
      "https://adrien-gueret.github.io/brewing_disaster/your_characters.html",
      "https://tinyurl.com/ybs6bmv8"
    )
    .replaceAll("./images/sprites.png", toBase64Url("./images/sprites.png"));

  const ids = [...indexHTML.matchAll(/id="([^"]*?)"/g)];

  ids.forEach((id, i) => {
    if (id[1].length > 5 && id !== "rules") {
      indexHTML = indexHTML.replaceAll(id[1], "_" + i);
    }
  });

  const minifiedHTML = await minify.html(indexHTML);

  // fs.writeFileSync("min.html", minifiedHTML, { encoding: "utf8" });

  console.log("Pack project...");
  const inputToPack = [
    {
      data: minifiedHTML,
      type: "text",
      action: "write",
    },
  ];

  const packer = new Packer(inputToPack);
  await packer.optimize();

  const packedCode = packer.makeDecoder();

  console.log("Write entry files...");

  fs.mkdirSync("./entry");

  fs.writeFileSync(
    "./entry/index.html",
    `<script>${packedCode.firstLine + packedCode.secondLine}</script>`,
    { encoding: "utf8" }
  );

  console.log("Zip entry folder...");
  await zip("./entry", "./entry.zip", { compression: COMPRESSION_LEVEL.high });

  console.log("Compress zip...");
  try {
    await execSync("ect.exe -9 -zip ./entry.zip", { env: process.env });
  } catch (e) {
    console.warn(
      "⚠ Cannot compress zip, please be sure ect.exe is installed and available from global scope"
    );
  }

  console.log("Get entry size...");
  const { size } = fs.statSync("./entry.zip");

  console.log("Entry size: " + size + " bytes");

  const JS13K_LIMIT_SIZE = 13312;

  const percent = Math.round(((size * 100) / JS13K_LIMIT_SIZE) * 100) / 100;
  const percentOfTotalBudget = "(" + percent + "% of total budget)";

  if (size > JS13K_LIMIT_SIZE) {
    console.error(
      "❌ File is " +
        (size - JS13K_LIMIT_SIZE) +
        "bytes too big! " +
        percentOfTotalBudget
    );
  } else {
    console.log(
      `✅ All good! ${JS13K_LIMIT_SIZE - size} bytes left. ` +
        percentOfTotalBudget
    );
  }

  console.log("");
  console.log("Entry generated");
})();
