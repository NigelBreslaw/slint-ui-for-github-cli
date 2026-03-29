/** Minimal `viewer` fields for normal app load (replaces REST `GET /user`). */
export const VIEWER_APP_GRAPHQL_QUERY = `
query ViewerApp {
  viewer {
    login
    name
    url
    avatarUrl
    status {
      message
      emojiHTML
    }
  }
}
`
  .replace(/\s+/g, " ")
  .trim();

/**
 * Broad `viewer { ... }` snapshot for `debug-json/gh-graphql--viewer-status.json` when
 * `GH_DEBUG_JSON=1` (trim this query once you know what you need).
 * `email` is omitted: GraphQL fails the entire query without `read:user` / `user:email` scope.
 */
export const VIEWER_DEBUG_GRAPHQL_QUERY = `
query ViewerDebugDump {
  viewer {
    avatarUrl
    bio
    bioHTML
    company
    companyHTML
    createdAt
    databaseId
    id
    isBountyHunter
    isCampusExpert
    isDeveloperProgramMember
    isEmployee
    isGitHubStar
    isHireable
    isSiteAdmin
    isViewer
    location
    login
    name
    pronouns
    resourcePath
    twitterUsername
    updatedAt
    url
    websiteUrl
    status {
      createdAt
      emojiHTML
      expiresAt
      id
      indicatesLimitedAvailability
      message
      updatedAt
    }
    followers(first: 1) { totalCount }
    following(first: 1) { totalCount }
    gists(first: 1) { totalCount }
    issueComments(first: 1) { totalCount }
    issues(first: 1) { totalCount }
    organizations(first: 1) { totalCount }
    pullRequests(first: 1) { totalCount }
    repositories(first: 1) { totalCount }
    repositoriesContributedTo(first: 1) { totalCount }
    starredRepositories(first: 1) { totalCount }
    sponsorshipsAsMaintainer(first: 1) { totalCount }
    sponsorshipsAsSponsor(first: 1) { totalCount }
    watching(first: 1) { totalCount }
  }
}
`
  .replace(/\s+/g, " ")
  .trim();
