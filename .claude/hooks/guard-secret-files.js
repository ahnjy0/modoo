// PreToolUse guard for Edit|Write: block modifying secret/sensitive files.
// Reads the hook input JSON from stdin. Prints a deny decision JSON if the
// target file looks like a secret; otherwise prints nothing (allow).

let data = "";
process.stdin.on("data", (chunk) => {
  data += chunk;
});
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(data);
    const filePath = (input.tool_input && input.tool_input.file_path) || "";
    if (!filePath) return;

    const base = filePath.split(/[/\\]/).pop() || "";
    const isExample = /\.example(\.|$)/i.test(base);

    const secretPatterns = [
      /^\.env/i,
      /\.pem$/i,
      /\.key$/i,
      /^credentials/i,
      /^secrets/i,
    ];

    const isSecret = !isExample && secretPatterns.some((p) => p.test(base));

    if (isSecret) {
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason: `비밀/민감 파일로 보이는 "${base}"은 자동으로 수정할 수 없도록 차단되어 있습니다. 정말 필요하다면 직접 수정해주세요.`,
          },
        })
      );
    }
  } catch {
    // 입력을 파싱할 수 없으면 그냥 통과시킨다 (안전 실패 = 차단 안 함).
  }
});
