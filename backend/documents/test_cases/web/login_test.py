import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class LoginTest(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.Chrome()
        self.driver.get("https://example.com/login")
        
    def test_valid_login(self):
        """Test login with valid credentials"""
        username_field = self.driver.find_element(By.ID, "username")
        password_field = self.driver.find_element(By.ID, "password")
        login_button = self.driver.find_element(By.ID, "login-btn")
        
        username_field.send_keys("testuser@example.com")
        password_field.send_keys("password123")
        login_button.click()
        
        # Wait for redirect to dashboard
        WebDriverWait(self.driver, 10).until(
            EC.url_contains("/dashboard")
        )
        
        self.assertIn("dashboard", self.driver.current_url)
        
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        username_field = self.driver.find_element(By.ID, "username")
        password_field = self.driver.find_element(By.ID, "password")
        login_button = self.driver.find_element(By.ID, "login-btn")
        
        username_field.send_keys("invalid@example.com")
        password_field.send_keys("wrongpassword")
        login_button.click()
        
        # Wait for error message
        error_message = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "error-message"))
        )
        
        self.assertTrue(error_message.is_displayed())
        
    def tearDown(self):
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()