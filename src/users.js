// Songs/comments/meatloafs reference people by userId; these helpers turn
// ids back into display names. Cards and lists show the DJ alias; the full
// "{first} {last} aka {alias}" form is for the identity picker.

export function userLabel(user) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return `${name} aka ${user.alias}`
}

export function aliasOf(usersById, userId) {
  return usersById[userId]?.alias || 'unknown DJ'
}

export function byId(users) {
  return Object.fromEntries(users.map((a) => [a.id, a]))
}
