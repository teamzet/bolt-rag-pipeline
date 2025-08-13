Feature: E-commerce Checkout Flow
  As a customer
  I want to complete my purchase
  So that I can receive my ordered items

  Background:
    Given I am on the e-commerce website
    And I have items in my shopping cart
    And I am logged in as a registered user

  Scenario: Successful checkout with credit card
    Given I have valid items in my cart totaling $50.00
    When I proceed to checkout
    And I enter valid shipping information
    And I select "Credit Card" as payment method
    And I enter valid credit card details
    And I click "Complete Order"
    Then I should see an order confirmation page
    And I should receive an order confirmation email
    And my cart should be empty

  Scenario: Checkout with invalid credit card
    Given I have valid items in my cart
    When I proceed to checkout
    And I enter valid shipping information
    And I select "Credit Card" as payment method
    And I enter invalid credit card details
    And I click "Complete Order"
    Then I should see an error message "Invalid credit card information"
    And I should remain on the payment page
    And my cart should still contain the items

  Scenario: Checkout with insufficient inventory
    Given I have an item in my cart that is out of stock
    When I proceed to checkout
    Then I should see an error message "Some items in your cart are no longer available"
    And I should be redirected to my cart page
    And the unavailable item should be highlighted