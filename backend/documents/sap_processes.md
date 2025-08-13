# SAP Business Processes Documentation

## Purchase Order (PO) Creation Process

### Overview
The Purchase Order creation process in SAP involves creating a formal document that authorizes a vendor to supply goods or services at agreed terms and conditions.

### Transaction Code: ME21N

### Prerequisites
- User must have appropriate authorization for PO creation
- Vendor master data must exist in the system
- Material master data must be maintained (for stock materials)
- Purchase organization and purchase group must be configured

### Step-by-Step Process

#### 1. Access PO Creation Transaction
- Navigate to SAP Easy Access menu
- Go to Logistics → Materials Management → Purchasing → Purchase Order → Create → Vendor/Supplying Plant Known (ME21N)
- Or enter transaction code ME21N directly

#### 2. Header Data Entry
**Mandatory Fields:**
- Vendor: Enter vendor number or use F4 help
- Purchase Organization: Usually defaulted based on user settings
- Purchase Group: Responsible purchasing group
- Company Code: Legal entity making the purchase

**Optional Fields:**
- Document Date: Defaults to current date
- Validity Start/End: Contract validity period
- Payment Terms: Defaults from vendor master
- Incoterms: Delivery terms

#### 3. Item Data Entry
For each line item, enter:
- Material Number: If ordering stock materials
- Short Text: Description of goods/services
- Quantity: Amount to be ordered
- Unit of Measure: Each, KG, etc.
- Net Price: Price per unit
- Plant: Receiving location
- Storage Location: Where material will be stored
- Delivery Date: When material is needed

#### 4. Additional Item Details
**Account Assignment (if required):**
- Cost Center: For expense items
- G/L Account: General ledger account
- Asset: For capital purchases
- Project/WBS Element: For project-related purchases

**Delivery Schedule:**
- Multiple delivery dates can be specified
- Partial deliveries can be allowed or prohibited

#### 5. Conditions and Pricing
- Net Price: Base price of the item
- Discounts: Any applicable discounts
- Taxes: VAT, sales tax as applicable
- Freight: Shipping costs
- Total Value: Automatically calculated

#### 6. Text and Attachments
- Header Text: General instructions for the vendor
- Item Text: Specific instructions for individual items
- Attachments: Technical drawings, specifications

#### 7. Release Strategy (if applicable)
- Some organizations require approval workflow
- PO may need to go through release procedure
- Check release status before transmission

#### 8. Save and Transmit
- Save the document (Ctrl+S)
- System generates unique PO number
- Transmit to vendor via EDI, email, or print

### Validation Rules
- Vendor must be active and not blocked
- Purchase organization must be assigned to company code
- Material must exist in plant if specified
- Delivery date cannot be in the past
- Price must be greater than zero
- Account assignment must be complete for expense items

### Common Error Messages
- "Vendor XXXXX is blocked for purchase organization YYYY"
- "Material XXXXX does not exist in plant YYYY"
- "Account assignment is incomplete"
- "No valid purchasing info record found"

### Best Practices
1. Always verify vendor details before creating PO
2. Ensure delivery dates are realistic
3. Include detailed specifications in text fields
4. Use standard terms and conditions
5. Verify pricing against contracts or quotations
6. Include proper account assignment for financial tracking

### Integration Points
- **Vendor Master (LFA1/LFM1)**: Vendor information
- **Material Master (MARA/MARC)**: Material details
- **Purchasing Info Records (EINE/EINA)**: Price conditions
- **Contracts (ME33K)**: Reference documents
- **Requisitions (ME53N)**: Source documents

### Reporting
- **ME2N**: Purchase Orders by Vendor
- **ME2M**: Purchase Orders by Material
- **ME2L**: Purchase Orders by Vendor and Material
- **ME80FN**: Reporting for Purchase Orders

## Goods Receipt Process (MIGO)

### Overview
Goods Receipt is the process of receiving materials or services against a Purchase Order and updating inventory and financial documents.

### Transaction Code: MIGO

### Process Flow
1. Physical receipt of goods
2. Quality inspection (if required)
3. System posting via MIGO
4. Inventory update
5. Financial document creation

### Key Fields
- Movement Type: 101 (GR for PO)
- Purchase Order Number
- Item Number
- Quantity Received
- Storage Location
- Batch Number (if batch managed)

### Validation Checks
- PO must exist and be released
- Quantity cannot exceed PO quantity (unless over-delivery allowed)
- Material must be available for goods receipt
- Storage location must be valid

This documentation provides the foundation for creating comprehensive test cases for SAP processes.