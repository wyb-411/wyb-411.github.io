"use client";

import { KEYUTIL, KJUR } from "jsrsasign";
import { githubConfig } from "@/lib/defaults";
import { setCachedToken, getCachedToken, useAuthStore } from "@/store/auth-store";
import { toBase64Utf8 } from "@/lib/utils";

const API = "https://api.github.com";
const headers = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28"
});

function pathForApi(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export function hasGithubAppConfig() {
  return Boolean(githubConfig.owner && githubConfig.repo && githubConfig.branch && githubConfig.appId);
}

export function signAppJwt(appId: string, pem: string) {
  const now = Math.floor(Date.now() / 1000);
  const key = KEYUTIL.getKey(pem);
  return KJUR.jws.JWS.sign(
    "RS256",
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
    JSON.stringify({ iat: now - 60, exp: now + 480, iss: appId }),
    key
  );
}

async function getInstallationId(jwt: string) {
  const response = await fetch(`${API}/repos/${githubConfig.owner}/${githubConfig.repo}/installation`, {
    headers: headers(jwt)
  });
  if (!response.ok) throw new Error(`installation lookup failed: ${response.status}`);
  return (await response.json()).id as number;
}

async function createInstallationToken(jwt: string, installationId: number) {
  const response = await fetch(`${API}/app/installations/${installationId}/access_tokens`, {
    method: "POST",
    headers: headers(jwt)
  });
  if (!response.ok) throw new Error(`create token failed: ${response.status}`);
  const payload = await response.json();
  return {
    token: payload.token as string,
    expiresAt: payload.expires_at as string | undefined
  };
}

export async function getAuthToken() {
  const cached = getCachedToken();
  if (cached) return cached;
  if (!hasGithubAppConfig()) throw new Error("GitHub App 凭据尚未配置");
  const pem = useAuthStore.getState().privateKey;
  if (!pem) throw new Error("当前 GitHub 凭据已过期，需要重新导入 GitHub App .pem 私钥");
  const jwt = signAppJwt(githubConfig.appId, pem);
  const installationId = await getInstallationId(jwt);
  const auth = await createInstallationToken(jwt, installationId);
  setCachedToken(auth.token, auth.expiresAt);
  return auth.token;
}

export async function readTextFileFromRepo(token: string, path: string) {
  const response = await fetch(
    `${API}/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${pathForApi(path)}?ref=${encodeURIComponent(githubConfig.branch)}`,
    { headers: headers(token) }
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`read file failed: ${response.status}`);
  const data = await response.json();
  if (Array.isArray(data) || !data.content) return null;
  try {
    return decodeURIComponent(escape(atob(data.content)));
  } catch {
    return atob(data.content);
  }
}

export async function getRef(token: string) {
  const response = await fetch(
    `${API}/repos/${githubConfig.owner}/${githubConfig.repo}/git/ref/${encodeURIComponent(`heads/${githubConfig.branch}`)}`,
    { headers: headers(token) }
  );
  if (!response.ok) throw new Error(`get ref failed: ${response.status}`);
  return (await response.json()).object.sha as string;
}

export async function createBlob(token: string, content: string, encoding: "utf-8" | "base64" = "base64") {
  const response = await fetch(`${API}/repos/${githubConfig.owner}/${githubConfig.repo}/git/blobs`, {
    method: "POST",
    headers: { ...headers(token), "Content-Type": "application/json" },
    body: JSON.stringify({ content, encoding })
  });
  if (!response.ok) throw new Error(`create blob failed: ${response.status}`);
  return (await response.json()).sha as string;
}

export type TreeItem = {
  path: string;
  mode: "100644";
  type: "blob";
  sha: string | null;
};

export async function createTree(token: string, tree: TreeItem[], baseTree: string) {
  const response = await fetch(`${API}/repos/${githubConfig.owner}/${githubConfig.repo}/git/trees`, {
    method: "POST",
    headers: { ...headers(token), "Content-Type": "application/json" },
    body: JSON.stringify({ tree, base_tree: baseTree })
  });
  if (!response.ok) throw new Error(`create tree failed: ${response.status}`);
  return (await response.json()).sha as string;
}

export async function createCommit(token: string, message: string, treeSha: string, parents: string[]) {
  const response = await fetch(`${API}/repos/${githubConfig.owner}/${githubConfig.repo}/git/commits`, {
    method: "POST",
    headers: { ...headers(token), "Content-Type": "application/json" },
    body: JSON.stringify({ message, tree: treeSha, parents })
  });
  if (!response.ok) throw new Error(`create commit failed: ${response.status}`);
  return (await response.json()).sha as string;
}

export async function updateRef(token: string, sha: string) {
  const response = await fetch(
    `${API}/repos/${githubConfig.owner}/${githubConfig.repo}/git/refs/${encodeURIComponent(`heads/${githubConfig.branch}`)}`,
    {
      method: "PATCH",
      headers: { ...headers(token), "Content-Type": "application/json" },
      body: JSON.stringify({ sha, force: false })
    }
  );
  if (!response.ok) throw new Error(`update ref failed: ${response.status}`);
}

export async function listRepoFilesRecursive(token: string, path: string): Promise<string[]> {
  const response = await fetch(
    `${API}/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${pathForApi(path)}?ref=${encodeURIComponent(githubConfig.branch)}`,
    { headers: headers(token) }
  );
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`read directory failed: ${response.status}`);
  const data = await response.json();
  if (Array.isArray(data)) {
    const output: string[] = [];
    for (const item of data) {
      if (item.type === "file") output.push(item.path);
      if (item.type === "dir") output.push(...(await listRepoFilesRecursive(token, item.path)));
    }
    return output;
  }
  return data?.type === "file" ? [data.path] : [];
}

export async function commitFiles(
  message: string,
  files: Array<{ path: string; content: string; encoding?: "base64" | "utf-8" }>,
  deletes: string[] = []
) {
  const token = await getAuthToken();
  const base = await getRef(token);
  const tree: TreeItem[] = [];
  for (const file of files) {
    const content = file.encoding === "utf-8" ? file.content : file.content;
    const sha = await createBlob(token, file.encoding === "utf-8" ? toBase64Utf8(content) : content, "base64");
    tree.push({ path: file.path, mode: "100644", type: "blob", sha });
  }
  for (const path of deletes) {
    tree.push({ path, mode: "100644", type: "blob", sha: null });
  }
  const treeSha = await createTree(token, tree, base);
  const commitSha = await createCommit(token, message, treeSha, [base]);
  await updateRef(token, commitSha);
  return {
    commitSha,
    commitUrl: `https://github.com/${githubConfig.owner}/${githubConfig.repo}/commit/${commitSha}`
  };
}
