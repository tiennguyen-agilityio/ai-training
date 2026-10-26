# shellcheck shell=bash
# For a push to develop. Sourced, not run, by deploy-api.yml (job push-image) and
# deploy-web.yml (develop alias): runs finish in any order, so an older run must not move
# a shared tag or alias that a newer develop commit will move itself.

# newer_develop PATH...: prints the develop head when develop has moved past $GITHUB_SHA
# with a change under PATH, nothing otherwise; fails on a git error.
newer_develop() {
  local head rc=0
  git fetch --quiet --depth=1 origin develop || return
  head=$(git rev-parse FETCH_HEAD) || return
  [ "$head" != "$GITHUB_SHA" ] || return 0
  git diff --quiet "$GITHUB_SHA" "$head" -- "$@" || rc=$?
  case "$rc" in
    0) ;;
    1) echo "$head" ;;
    *) echo "git diff $GITHUB_SHA..$head failed with exit $rc" >&2; return "$rc" ;;
  esac
}
