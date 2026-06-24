Feature: Login Screen
  As a guest
  I want to reach the login screen and switch language
  So that I can sign in to SAA 2025
  Path: /login

  # The app defaults to Vietnamese (no NEXT_LOCALE cookie), so the baked
  # selector strings are the vi copy from messages/vi.json.

  @auto @smoke
  Scenario: Guest sees the login entry point
    Given User is on [login] page
    Then User see [welcome] text
    And User see [google login] button is enabled
    And User see [copyright] text
    And User see [close error] button is hidden

  @auto
  Scenario: Visiting a protected route redirects a guest to login
    Given User is on [home] page
    Then User see [login] page

  @auto
  Scenario: A known error code shows the error banner
    Given User is on [login domain error] page
    Then User see [close error] button
    And User see [error banner] text contains {{domain_error_fragment}}

  @auto
  Scenario: Switching language renders the UI in English
    Given User is on [login] page
    When User click [language] button
    And User click [english] option
    Then User see [google login en] button is enabled
