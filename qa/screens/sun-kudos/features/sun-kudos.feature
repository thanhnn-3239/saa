Feature: Sun* Kudos board
  As a logged-in Sunner
  I want to browse, filter, and react to kudos
  So that I can see and give recognition
  Path: /sun-kudos

  # @auth:member compiles to test.use({ storageState: 'specs/.auth/member.json' }),
  # minted by specs/auth.setup.ts via the /auto-login backdoor. Data contract:
  # supabase/seeds/dev/seed_e2e_kudos.sql ([e2e-kN] body markers).

  @auto @auth:member @smoke
  Scenario: A logged-in member sees the three board sections
    Given User is on [sun-kudos] page
    Then User see [highlight heading] header
    And User see [spotlight heading] header
    And User see [all kudos heading] header

  @auto @auth:member
  Scenario: Filtering by an unused hashtag empties the feed
    Given User is on [sun-kudos] page
    When User click [hashtag filter] button
    And User click [positivity option] option
    Then User see [empty feed] text

  @auto @auth:member
  Scenario: Filtering by a hashtag drops non-matching kudos
    Given User is on [sun-kudos] page
    When User click [hashtag filter] button
    And User click [teamwork option] option
    Then User see [k3 feed card] card is hidden

  @auto @auth:member
  Scenario: A member likes then unlikes a kudo
    Given User is on [sun-kudos] page
    Then User see [k1 heart unliked] button
    When User click [k1 heart] button
    Then User see [k1 heart liked] button
    When User click [k1 heart] button
    Then User see [k1 heart unliked] button
