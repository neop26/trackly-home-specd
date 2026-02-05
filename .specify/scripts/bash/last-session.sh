#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
tracker="$root_dir/docs/PROJECT_TRACKER.md"

if [[ ! -f "$tracker" ]]; then
  echo "PROJECT_TRACKER.md not found at $tracker" >&2
  exit 1
fi

echo "Last Commit:"
git -C "$root_dir" log -1 --format="%h %ad %s" --date=short

echo ""
echo "Branch:"
git -C "$root_dir" branch --show-current

echo ""
echo "Current Phase:"
awk -F": " '/^\*\*Current Phase:/{print $2}' "$tracker"

echo ""
echo "In Progress Tasks:"
awk -F"|" '
  /^\| [0-9]+\.[0-9]+ \|/ {
    gsub(/^\s+|\s+$/, "", $1)
    gsub(/^\s+|\s+$/, "", $2)
    gsub(/^\s+|\s+$/, "", $5)
    gsub(/^\s+|\s+$/, "", $6)
    if ($5 ~ /🟡/ || $6 ~ /🟡/) {
      task_id = $1
      task_name = $2
      print "- " task_id " " task_name
    }
  }
' "$tracker"
