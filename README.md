# Load Linear Issues

A GitHub Action that extracts Linear issue references from Git commits for use in downstream actions.

## Usage

```yaml
- uses: your-org/load-linear-issues@v1
  id: linear
  with:
    linear-api-key: ${{ secrets.LINEAR_API_KEY }}
    commits-count: '10'

- name: Use Linear Issues
  run: |
    echo "Found ${{ steps.linear.outputs.issue-count }} issues"
    echo "Keys: ${{ steps.linear.outputs.issue-keys }}"
```

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `linear-api-key` | Yes | Linear API key for authentication |
| `team-keys` | No | Comma-separated team keys to filter (e.g., "ENG,PROD") |
| `output-file` | No | Path for JSON output (default: `linear-issues.json`) |

### Changeset Specification (exactly one required)

| Input | Description |
|-------|-------------|
| `commits-count` | Number of recent commits to scan |
| `commits-since-sha` | Commits after this SHA |
| `commits-shas` | Specific commit SHAs (comma-separated) |
| `commits-start-sha` + `commits-end-sha` | Commit range |
| `tags-start` + `tags-end` | Tag range |
| `time-range-start` + `time-range-end` | ISO 8601 time range |
| `releases-count` | Recent N release tags |

## Outputs

| Output | Description |
|--------|-------------|
| `issue-keys` | Comma-separated Linear issue keys |
| `issue-links` | Comma-separated Linear issue URLs |
| `issue-count` | Number of unique issues found |

## JSON Output Format

```json
{
  "metadata": {
    "generatedAt": "2024-01-01T00:00:00.000Z",
    "linearBaseUrl": "https://linear.app",
    "repository": "owner/repo",
    "changeset": { "type": "commits-count", "commitsCount": 10 },
    "totalIssues": 3,
    "totalCommits": 10
  },
  "issues": [
    {
      "key": "ENG-123",
      "url": "https://linear.app/issue/ENG-123",
      "commits": ["abc123", "def456"]
    }
  ]
}
```

## Local Testing

1. Copy `.secrets.example` to `.secrets` and fill in your Linear API key
2. Run: `npm run build && npm run package`
3. Execute with [act](https://github.com/nektos/act): `act workflow_dispatch --secret-file .secrets`

## Development

```bash
npm install
npm run build
npm test
npm run package
```

## License

MIT
