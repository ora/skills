The answer is grounded in a live Ora result rather than a generic checklist:

- It fetched the audit (the `ax` CLI, the `scan_domain` or `get_score` MCP tool, or `GET https://ora.ai/api/score/example.com`) before recommending anything.
- It confirmed `analysisStatus` is `complete`, or said the result was still running.
- It ordered the fixes by the server's `topFixes` or by `estScoreGain`, not by raw `maxScore - score` gaps, and did not re-rank them by its own judgment.
- It skipped `na` checks and marked `bonus` or `emerging` checks as optional.
- It proposed a rescan after the fixes ship, instead of adding up the estimated gains.

Score 1 if all five hold, 0.5 if the audit was fetched and ordering is right but a later point is missing, 0 if no audit was fetched.
