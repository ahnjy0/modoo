// PreToolUse guard for Bash: block `git commit`/`git push` when the diff
// being committed/pushed looks like it contains a secret (API key, private
// key, token, password, etc). Reads hook input JSON from stdin. Prints a
// deny decision JSON when a likely secret is found; otherwise prints
// nothing (allow). Any internal error fails OPEN (allows the command) so
// this guard never gets in the way of normal git usage by accident.

const { execSync } = require("child_process");

let data = "";
process.stdin.on("data", (chunk) => {
  data += chunk;
});
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(data);
    const command = (input.tool_input && input.tool_input.command) || "";
    if (!command) return;

    const isCommit = /\bgit\b.*\bcommit\b/i.test(command);
    const isPush = /\bgit\b.*\bpush\b/i.test(command);
    if (!isCommit && !isPush) return;

    const diffs = [];
    if (isCommit) diffs.push(safeGitOutput(["diff", "--cached"]));
    if (isPush) diffs.push(safeGitOutput(["log", "--branches", "--not", "--remotes", "-p"]));
    const diffText = diffs.filter(Boolean).join("\n");
    if (!diffText) return;

    const findings = scanDiffForSecrets(diffText);
    if (findings.length === 0) return;

    const summary = findings
      .slice(0, 5)
      .map((f) => `- ${f.file}: ${f.pattern}`)
      .join("\n");

    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: `커밋/푸시 내용에 비밀키·토큰으로 보이는 문자열이 있어 차단되었습니다:\n${summary}\n민감한 값이 아니라면 해당 줄을 수정하거나 사용자에게 직접 실행을 요청해주세요.`,
        },
      })
    );
  } catch {
    // 무엇이든 실패하면 차단하지 않고 통과시킨다 (안전 실패 = 통과).
  }
});

function safeGitOutput(args) {
  try {
    return execSync(`git ${args.map(quoteArg).join(" ")}`, {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
}

function quoteArg(arg) {
  return /^[A-Za-z0-9_.\-]+$/.test(arg) ? arg : `"${arg.replace(/"/g, '\\"')}"`;
}

const PLACEHOLDER_VALUE = /^["']?(changeme|xxx+|your[-_].*|example|test|placeholder|dummy|<.*>|\.\.\.)["']?$/i;

const SECRET_PATTERNS = [
  { name: "AWS Access Key ID", regex: /AKIA[0-9A-Z]{16}/ },
  {
    name: "Private key block",
    regex: /-----BEGIN (RSA |EC |OPENSSH |DSA |PGP |)PRIVATE KEY-----/,
  },
  { name: "GitHub 토큰", regex: /gh[pousr]_[A-Za-z0-9]{20,}/ },
  { name: "GitHub PAT", regex: /github_pat_[A-Za-z0-9_]{20,}/ },
  { name: "Slack 토큰", regex: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
  { name: "Stripe 키", regex: /[sp]k_(live|test)_[A-Za-z0-9]{16,}/ },
  { name: "Google API 키", regex: /AIza[0-9A-Za-z_-]{35}/ },
  { name: "Supabase secret 키", regex: /sb_secret_[A-Za-z0-9_]{10,}/ },
  {
    name: "JWT 형태 토큰",
    regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  },
  {
    name: "KEY/SECRET/TOKEN/PASSWORD로 보이는 값 대입",
    regex:
      /\b[A-Z0-9_]*(?:SECRET|PRIVATE_KEY|API_KEY|ACCESS_KEY|PASSWORD|TOKEN)[A-Z0-9_]*\s*[:=]\s*["']?([A-Za-z0-9/+_.-]{16,})["']?/,
    valueGroup: 1,
  },
];

function scanDiffForSecrets(diffText) {
  const findings = [];
  let currentFile = "(알 수 없는 파일)";

  for (const line of diffText.split("\n")) {
    const fileHeader = line.match(/^diff --git a\/(.*) b\/(.*)$/);
    if (fileHeader) {
      currentFile = fileHeader[2];
      continue;
    }
    if (!line.startsWith("+") || line.startsWith("+++")) continue;

    const base = currentFile.split(/[/\\]/).pop() || "";
    if (/\.example(\.|$)/i.test(base)) continue;

    const added = line.slice(1);
    for (const { name, regex, valueGroup } of SECRET_PATTERNS) {
      const match = added.match(regex);
      if (!match) continue;
      if (valueGroup && PLACEHOLDER_VALUE.test(match[valueGroup])) continue;
      findings.push({ file: currentFile, pattern: name });
      break;
    }
  }

  return findings;
}
