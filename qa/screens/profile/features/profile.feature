Feature: Profile page
  As a logged-in Sunner
  I want to open my profile page
  So that I can manage my account when the feature launches
  Path: /profile

  # ComingSoon stub (same as awards-information): assert the authed member
  # reaches the page, the placeholder renders, and back-home navigates.
  # Guest redirect for /profile is covered by e2e/auth-redirect.spec.ts.

  @auto @auth:member @smoke
  Scenario: A logged-in member sees the coming-soon placeholder
    Given User is on [profile] page
    Then User see [coming soon title] header
    And User see [back home] link

  @auto @auth:member
  Scenario: The back-home link returns to the homepage
    Given User is on [profile] page
    When User click [back home] link
    Then User see [awards system heading] header
