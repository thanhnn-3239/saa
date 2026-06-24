Feature: Notifications page
  As a logged-in Sunner
  I want to open the notifications page
  So that I can review all my notifications in one place
  Path: /notifications

  # @auth:member compiles to storageState: 'specs/.auth/member.json', minted by
  # specs/auth.setup.ts (member03) via the /auto-login backdoor.
  # Assertions are seed-independent: the page heading and the "mark all read"
  # control render regardless of whether the member has any notifications.

  @auto @auth:member @smoke
  Scenario: A logged-in member sees the notifications page
    Given User is on [notifications] page
    Then User see [page heading] header
    And User see [mark all read] button
