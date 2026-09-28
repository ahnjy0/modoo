// PreToolUse guard for Bash: block dangerous recursive/force deletions and
// deletions targeting secret/sensitive files. Reads hook input JSON from
// stdin. Prints a deny decision JSON when blocked; otherwise prints nothing.

let data = "";
process.stdin.on("data", (chunk) => {
  data += chunk;
});
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(data);
    const command = (input.tool_input && input.tool_input.command) || "";
    if (!command) return;

    const deny = (reason) => {
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason: reason,
          },
        })
      );
    };

    // 1) rm -rf 류(재귀 + 강제)의 위험한 삭제 명령
    const rmRecursiveForce =
      /\brm\b[^|;&\n]*?(-[a-z]*r[a-z]*f[a-z]*\b|-[a-z]*f[a-z]*r[a-z]*\b|--recursive\b[^|;&\n]*?--force\b|--force\b[^|;&\n]*?--recursive\b)/i;
    const windowsRecursiveForce =
      /\b(rmdir|rd)\b[^|;&\n]*\/s\b[^|;&\n]*\/q\b|\b(rmdir|rd)\b[^|;&\n]*\/q\b[^|;&\n]*\/s\b/i;
    const delRecursiveForce = /\bdel\b[^|;&\n]*\/f\b[^|;&\n]*\/s\b|\bdel\b[^|;&\n]*\/s\b[^|;&\n]*\/f\b/i;
    const powershellRecursiveForce =
      /remove-item\b[^|;&\n]*-recurse\b[^|;&\n]*-force\b|remove-item\b[^|;&\n]*-force\b[^|;&\n]*-recurse\b/i;

    if (
      rmRecursiveForce.test(command) ||
      windowsRecursiveForce.test(command) ||
      delRecursiveForce.test(command) ||
      powershellRecursiveForce.test(command)
    ) {
      return deny(
        "재귀 + 강제 삭제 명령(rm -rf 등)은 되돌릴 수 없어 차단되어 있습니다. 정말 필요하면 대상 경로를 정확히 지정해 사용자에게 직접 실행을 요청해주세요."
      );
    }

    // 2) 비밀/민감 파일(.env*, *.pem, *.key, credentials*, secrets*)을 대상으로 하는 삭제/삭제성 명령
    const secretToken = /(^|[\s/\\])(\.env[^\s]*|[^\s/\\]*\.pem|[^\s/\\]*\.key|credentials[^\s]*|secrets[^\s]*)(?=$|[\s])/i;
    const deletionVerb = /\b(rm|del|rd|rmdir|remove-item)\b/i;

    if (deletionVerb.test(command) && secretToken.test(command)) {
      const match = command.match(secretToken);
      const token = match ? match[2] : "해당 파일";
      if (!/\.example(\.|$)/i.test(token)) {
        return deny(
          `비밀/민감 파일로 보이는 "${token}"을 삭제하는 명령은 차단되어 있습니다.`
        );
      }
    }
  } catch {
    // 입력을 파싱할 수 없으면 그냥 통과시킨다 (안전 실패 = 차단 안 함).
  }
});
