# The raea 0.1.6-rc0 (a copy), headless, on a scratch world. Nothing here reads or writes the person's ~/.raea,
# ~/Documents/raea or global git config: HOME, the global git config and every data folder are under /tmp/goose-tut-take.
S=/tmp/goose-tut-take16
export HOME=$S/home
export GIT_CONFIG_GLOBAL=$S/gitconfig GIT_CONFIG_NOSYSTEM=1
export RAEA_FEED_DATA=$S/data RAEA_LOGS=$S/logs RAEA_UPDATE_DIR=$S/update
export RAEA_APP_HEADLESS=1 RAEA_PAGE_MCP_PORT=7536 RAEA_WINDOW_SCALE=${RAEA_WINDOW_SCALE:-2}
export RAEA_NO_OPEN=1 RAEA_NO_POSTMORTEM=1 RAEA_AUDIO_MUTE=1 RAEA_REACH=off RAEA_TELEMETRY=0 RAEA_UPDATE=0 RAEA_LIBRARY_AUTO=0
export RAEA_SIGNIN=optional RAEA_ONBOARDING=skip
export RAEA_KEYCHAIN=raea-take-signed-out RAEA_KEYS_KEYCHAIN=raea-take-no-keys RAEA_ACCOUNT=$S/state/no-account.json
export RAEA_ONBOARDING_FILE=$S/state/onboarding.json RAEA_NODE_FILE=$S/state/node.json RAEA_SESSIONS_DIR=$S/state/sessions
export RAEA_APP_PREFS=$S/state/app-prefs.json RAEA_PLUGINS=$S/state/plugins RAEA_INBOX_DIR=$S/state/inbox RAEA_EXPORT_DIR=$S/state/exports RAEA_TASTE=$S/state/taste
export RAEA_AGENT_CMD_KIMI="[\"$S/bin/kimi\",\"acp\"]" KIMI_CODE_HOME=$S/state/kimi
