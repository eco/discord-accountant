// Reasons why a command execution may be rejected
// Used in tests
export type COMMAND_ERROR =
  | "NOT_ADMIN"
  | "NOT_ENOUGH_POINTS"
  | "INVALID_ARGUMENTS"
  | "WRONG_CHANNEL"
