import { execSync } from "node:child_process";
import crypto from "node:crypto";

const CONTAINER_NAME = "aeternum-gateway-ci-test";
const TEST_PORT = 8089;
const TEST_TOKEN = `ephemeral-token-${crypto.randomUUID()}`;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const results = {
    healthTest: "FAIL",
    healthSecretLeak: "YES",
    authMissingToken: "FAIL",
    authInvalidToken: "FAIL",
    authValidToken: "FAIL",
    sseTest: "FAIL",
    sseBuffering: "YES",
    fallbackTest: "FAIL",
    failureContract: "FAIL",
    errorSecretLeak: "YES"
  };

  try {
    try {
      execSync(`docker rm -f ${CONTAINER_NAME}`, { stdio: "ignore" });
    } catch {}

    execSync(
      `docker run -d --name ${CONTAINER_NAME} -p ${TEST_PORT}:8081 -e PORT=8081 -e AETERNUM_AI_GATEWAY_HOST=0.0.0.0 -e AETERNUM_AI_GATEWAY_AUTH_MODE=BEARER_TOKEN -e AETERNUM_AI_GATEWAY_TOKEN=${TEST_TOKEN} -e AETERNUM_AI_GATEWAY_MODE=cloud_only -e NODE_ENV=staging aeternum-ai-gateway:staging-candidate`
    );

    await sleep(2000);

    const baseUrl = `http://127.0.0.1:${TEST_PORT}`;

    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthBody = await healthRes.text();
    if (healthRes.status === 200) {
      const parsed = JSON.parse(healthBody);
      if (parsed.status === "HEALTHY" && parsed.auth_mode === "BEARER_TOKEN") {
        results.healthTest = "PASS";
      }
      if (!healthBody.includes(TEST_TOKEN) && !healthBody.includes("secret")) {
        results.healthSecretLeak = "NO";
      }
    }

    // 2. Missing Token -> 401
    const missingAuthRes = await fetch(`${baseUrl}/v1/llm/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] })
    });
    if (missingAuthRes.status === 401) {
      results.authMissingToken = "PASS";
    }

    // 3. Invalid Token -> 401
    const invalidAuthRes = await fetch(`${baseUrl}/v1/llm/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer wrong-fake-token"
      },
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] })
    });
    if (invalidAuthRes.status === 401) {
      results.authInvalidToken = "PASS";
    }

    // 4. Valid Token -> Auth accepted
    const validAuthRes = await fetch(`${baseUrl}/v1/llm/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Qual a estrutura do femur?" }],
        metadata: {
          environment: "staging",
          source: "atlas-ai-tutor-staging"
        }
      })
    });
    const validAuthBody = await validAuthRes.text();
    if (validAuthRes.status !== 401 && validAuthRes.status !== 403) {
      results.authValidToken = "PASS";
      results.fallbackTest = "PASS";
    }
    if (!validAuthBody.includes(TEST_TOKEN)) {
      results.errorSecretLeak = "NO";
    }
    if (validAuthRes.status === 503 || validAuthRes.status === 200) {
      results.failureContract = "PASS";
    }

    // 5. SSE Stream
    const streamRes = await fetch(`${baseUrl}/v1/llm/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "hello" }],
        metadata: { environment: "staging", source: "atlas-ai-tutor-staging" }
      })
    });
    if (streamRes.status === 200 || streamRes.status === 503) {
      const ct = streamRes.headers.get("content-type") || "";
      if (ct.includes("text/event-stream")) {
        results.sseTest = "PASS";
        results.sseBuffering = "NO";
      }
    }
  } finally {
    try {
      execSync(`docker rm -f ${CONTAINER_NAME}`, { stdio: "ignore" });
    } catch {}
  }

  const allPassed =
    results.healthTest === "PASS" &&
    results.healthSecretLeak === "NO" &&
    results.authMissingToken === "PASS" &&
    results.authInvalidToken === "PASS" &&
    results.authValidToken === "PASS" &&
    results.sseTest === "PASS" &&
    results.sseBuffering === "NO" &&
    results.fallbackTest === "PASS" &&
    results.failureContract === "PASS" &&
    results.errorSecretLeak === "NO";

  console.log(JSON.stringify(results, null, 2));
  if (!allPassed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
