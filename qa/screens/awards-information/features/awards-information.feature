Feature: Awards Information page
  As a logged-in Sunner
  I want to open the Awards Information page
  So that I can read about the award categories when they launch
  Path: /awards-information

  # The page is currently a ComingSoon stub inside the shared (public) layout —
  # so the meaningful checks are: an authed member is NOT bounced to /login,
  # the placeholder renders, the app chrome (header nav) is present, and the
  # back-home link actually navigates. Guest redirect for this route is already
  # covered by e2e/auth-redirect.spec.ts.

  @auto @auth:member @smoke
  Scenario: A logged-in member sees the coming-soon placeholder
    Given User is on [awards-information] page
    Then User see [coming soon title] header
    And User see [back home] link
    And User see [award information nav] link

  @auto @auth:member
  Scenario: The back-home link returns to the homepage
    Given User is on [awards-information] page
    When User click [back home] link
    Then User see [awards system heading] header
