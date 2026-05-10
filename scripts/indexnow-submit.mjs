import { readFile } from "node:fs/promises";

const key = "c29f1a4d2f584f56b60e1b6d2f8e9c71";
const host = "www.winpk99.com";
const keyLocation = `https://${host}/${key}.txt`;

function extractUrls(sitemap) {
  return [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

const sitemap = await readFile("sitemap.xml", "utf8");
const urlList = extractUrls(sitemap);

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: {
    "content-type": "application/json; charset=utf-8",
  },
  body: JSON.stringify({
    host,
    key,
    keyLocation,
    urlList,
  }),
});

if (![200, 202].includes(response.status)) {
  const body = await response.text();
  throw new Error(`IndexNow submit failed: HTTP ${response.status} ${body}`);
}

console.log(`Submitted ${urlList.length} URLs to IndexNow.`);
