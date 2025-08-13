"""
SAP Purchase Order Creation Test Script
Test Case ID: SAP_PO_001
Description: Automated test for creating purchase orders in SAP
"""

import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

class SAPPOCreationTest(unittest.TestCase):
    
    def setUp(self):
        """Setup test environment"""
        self.driver = webdriver.Chrome()
        self.driver.maximize_window()
        self.base_url = "https://sap-test-environment.com"
        self.username = "test_user"
        self.password = "test_password"
        
    def test_create_purchase_order(self):
        """
        Test Case: Create Purchase Order in SAP
        Steps:
        1. Login to SAP system
        2. Navigate to Purchase Order creation
        3. Fill mandatory fields
        4. Save the PO
        5. Verify PO creation
        """
        
        # Step 1: Login to SAP
        self.driver.get(self.base_url)
        
        username_field = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.ID, "username"))
        )
        username_field.send_keys(self.username)
        
        password_field = self.driver.find_element(By.ID, "password")
        password_field.send_keys(self.password)
        
        login_button = self.driver.find_element(By.ID, "login-btn")
        login_button.click()
        
        # Step 2: Navigate to PO creation
        WebDriverWait(self.driver, 15).until(
            EC.presence_of_element_located((By.ID, "main-menu"))
        )
        
        # Navigate to MM module
        mm_menu = self.driver.find_element(By.XPATH, "//span[text()='Materials Management']")
        mm_menu.click()
        
        # Click on Purchase Order
        po_menu = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//span[text()='Purchase Order']"))
        )
        po_menu.click()
        
        # Click Create
        create_po = self.driver.find_element(By.XPATH, "//span[text()='Create']")
        create_po.click()
        
        # Step 3: Fill mandatory fields
        # Vendor field
        vendor_field = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.ID, "vendor-input"))
        )
        vendor_field.send_keys("VENDOR001")
        
        # Purchase Organization
        porg_field = self.driver.find_element(By.ID, "porg-input")
        porg_field.send_keys("1000")
        
        # Purchase Group
        pgroup_field = self.driver.find_element(By.ID, "pgroup-input")
        pgroup_field.send_keys("001")
        
        # Company Code
        company_field = self.driver.find_element(By.ID, "company-input")
        company_field.send_keys("1000")
        
        # Add line item
        add_item_btn = self.driver.find_element(By.ID, "add-item-btn")
        add_item_btn.click()
        
        # Material number
        material_field = WebDriverWait(self.driver, 5).until(
            EC.presence_of_element_located((By.ID, "material-input"))
        )
        material_field.send_keys("MAT001")
        
        # Quantity
        qty_field = self.driver.find_element(By.ID, "quantity-input")
        qty_field.send_keys("10")
        
        # Unit price
        price_field = self.driver.find_element(By.ID, "price-input")
        price_field.send_keys("100.00")
        
        # Step 4: Save the PO
        save_button = self.driver.find_element(By.ID, "save-btn")
        save_button.click()
        
        # Step 5: Verify PO creation
        success_message = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "success-message"))
        )
        
        self.assertIn("Purchase Order created successfully", success_message.text)
        
        # Get PO number for verification
        po_number_element = self.driver.find_element(By.ID, "po-number")
        po_number = po_number_element.text
        
        self.assertIsNotNone(po_number)
        self.assertTrue(len(po_number) > 0)
        
        print(f"Purchase Order created successfully: {po_number}")
        
    def tearDown(self):
        """Clean up after test"""
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()