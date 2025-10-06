==============================================
INVENTORY MANAGEMENT SYSTEM - SETUP GUIDE
==============================================

## OVERVIEW
This is a full-stack Inventory Management Web Application with complete backend and frontend functionality.
Built with React, TypeScript, Tailwind CSS, and Supabase backend.

## FEATURES IMPLEMENTED

1. ✅ Suppliers Management
   - Add, edit, delete suppliers
   - Fields: name, contact, address, GST number
   
2. ✅ Products Management
   - Add, edit, delete products
   - Fields: name, code, category, supplier, prices, stock, unit
   
3. ✅ Customers Management
   - Add, edit, delete customers
   - Fields: name, contact, address, email
   
4. ✅ Sales & Billing System
   - Select products with auto-calculations
   - Automatic total, taxes (18% default), discounts
   - Stock updates automatically
   - Bill generation with unique bill numbers
   
5. ✅ Payments Management
   - Track received, pending, partial payments
   - Multiple payment modes (cash, card, UPI, bank transfer, cheque)
   - Payment history tracking
   
6. ⚠️  SMS Integration (Placeholder ready)
   - Structure is ready for SMS API integration
   - See "SMS SETUP" section below
   
7. ✅ Customer Login Portal
   - Customers can log in with admin-given credentials
   - View their bills and payment history
   - Download invoices (structure ready)
   
8. ✅ Admin Dashboard
   - Complete inventory management
   - Sales tracking
   - Payment management
   - Multiple views for different functions
   
9. ✅ Search, Filter & Sort
   - Available across all data tables
   - Real-time search functionality

## INSTALLATION & SETUP

### Prerequisites
- Node.js 18+ installed
- Supabase account (already configured)
- Modern web browser

### Quick Start

1. Install Dependencies:
   ```bash
   npm install
   ```

2. Start Development Server:
   ```bash
   npm run dev
   ```

3. Access the Application:
   - Admin Dashboard: http://localhost:5173/dashboard
   - Customer Portal: http://localhost:5173/customer-portal
   - Landing Page: http://localhost:5173/

### Default Admin Login
- Go to: http://localhost:5173/auth
- Sign up with your email and password
- This creates your admin account

## CUSTOMIZATION GUIDE

### 1. COMPANY BRANDING

#### Logo Upload
- Place your company logo in: `src/assets/`
- Update logo references in components
- Recommended size: 200x50px (PNG format)

#### Company Information
Edit these files to add your company details:
- `src/pages/Dashboard.tsx` - Update header/branding
- `src/components/dashboard/PrintBillView.tsx` - Add company details to bills

Example customization in PrintBillView.tsx:
```typescript
const companyInfo = {
  name: "Your Company Name",
  address: "Your Address",
  phone: "Your Phone",
  email: "your@email.com",
  gst: "Your GST Number"
};
```

### 2. TAX CONFIGURATION

Default tax rate is 18%. To change:

File: `src/components/dashboard/SalesView.tsx`
```typescript
const [taxRate, setTaxRate] = useState("18"); // Change default here
```

### 3. PAYMENT MODES

To add/modify payment modes:

File: `src/components/dashboard/PaymentsView.tsx`
```typescript
<select>
  <option value="cash">Cash</option>
  <option value="card">Card</option>
  <option value="upi">UPI</option>
  <option value="bank_transfer">Bank Transfer</option>
  <option value="cheque">Cheque</option>
  // Add more options here
</select>
```

### 4. PRODUCT UNITS

To add/modify product units:

File: `src/components/dashboard/ProductsView.tsx`
```typescript
<select>
  <option value="pcs">Pieces</option>
  <option value="kg">Kilogram</option>
  <option value="ltr">Liter</option>
  <option value="box">Box</option>
  <option value="dozen">Dozen</option>
  // Add more units here
</select>
```

### 5. SMS INTEGRATION SETUP

The system is ready for SMS integration. To implement:

1. Choose an SMS Provider:
   - Twilio (recommended)
   - Fast2SMS
   - Other SMS gateway

2. Add your SMS API credentials:
   - In Supabase Dashboard: Settings → Secrets
   - Add: `SMS_API_KEY`

3. Create SMS Edge Function:
   ```typescript
   // supabase/functions/send-sms/index.ts
   import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
   
   serve(async (req) => {
     const { phone, message } = await req.json();
     
     // Your SMS API call here
     const response = await fetch("YOUR_SMS_API_URL", {
       method: "POST",
       headers: {
         "Authorization": `Bearer ${Deno.env.get("SMS_API_KEY")}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({ phone, message }),
     });
     
     return new Response(JSON.stringify({ success: true }));
   });
   ```

4. Call SMS function from your components:
   ```typescript
   await supabase.functions.invoke('send-sms', {
     body: { 
       phone: customerPhone, 
       message: `Your bill ${billNumber} is ready!` 
     }
   });
   ```

### 6. CREATING CUSTOMER CREDENTIALS

Admins need to create customer login credentials:

1. Go to Dashboard → Customers
2. After adding a customer, manually insert credentials in Supabase:
   - Go to Supabase Dashboard → Table Editor → customer_credentials
   - Add new row:
     - customer_id: (select from customers table)
     - username: (create unique username)
     - password_hash: (for now, use plain password - implement hashing in production)
     - is_active: true

**IMPORTANT SECURITY NOTE**: 
The current implementation stores passwords in plain text for simplicity. 
For production, implement proper password hashing using bcrypt or similar.

### 7. THEME CUSTOMIZATION

Colors and styling are in:
- `src/index.css` - Main theme variables
- `tailwind.config.ts` - Tailwind configuration

To change primary color:
```css
/* src/index.css */
:root {
  --primary: 200 100% 50%; /* Change HSL values */
}
```

## DATABASE STRUCTURE

### Main Tables:
- **suppliers** - Supplier information with GST
- **products** - Product catalog with stock levels
- **customers** - Customer details
- **bills** - Sales/invoice records
- **bill_items** - Individual items in each bill
- **payments** - Payment tracking
- **customer_credentials** - Customer portal login

### Key Features:
- Row Level Security (RLS) enabled
- User-specific data isolation
- Automatic ID generation
- Timestamp tracking

## DEPLOYMENT

### Build for Production:
```bash
npm run build
```

### Deploy Options:
1. Lovable Cloud (recommended)
   - Click "Publish" button in Lovable interface
   
2. Manual Deployment:
   - Build the project
   - Deploy `dist` folder to your hosting
   - Configure environment variables

## COMMON TASKS

### Adding a New Supplier:
1. Dashboard → Suppliers
2. Fill in details (name, contact, GST required)
3. Click "Add Supplier"

### Creating a Sale:
1. Dashboard → Create Sale
2. Select customer (optional)
3. Add products with quantities
4. Adjust discount/tax if needed
5. Click "Create Bill"
6. Stock automatically updates

### Recording a Payment:
1. Dashboard → Payments
2. Select unpaid/partial bill
3. Enter payment amount and mode
4. Add reference number if needed
5. Click "Record Payment"

### Customer Portal Access:
1. Create customer credentials (see section 6)
2. Share credentials with customer
3. Customer logs in at /customer-portal
4. Can view bills and download invoices

## SECURITY RECOMMENDATIONS

1. **Password Hashing**: Implement bcrypt for customer passwords
2. **Environment Variables**: Move sensitive data to environment variables
3. **API Keys**: Store SMS/payment gateway keys securely
4. **HTTPS**: Use HTTPS in production
5. **Regular Backups**: Set up automatic database backups
6. **Access Control**: Review RLS policies regularly

## TROUBLESHOOTING

### Issue: Can't see data after login
- Check RLS policies in Supabase
- Ensure user_id is set correctly

### Issue: Stock not updating
- Check product table permissions
- Verify RLS policies allow updates

### Issue: Customer can't login
- Verify credentials exist in customer_credentials table
- Check is_active is set to true
- Ensure customer_id matches correctly

### Issue: Bills not generating
- Check bill_items table has proper permissions
- Verify bill_number generation function works

## SUPPORT & CUSTOMIZATION

For additional customization or support:
1. Check Lovable documentation
2. Review Supabase docs for backend queries
3. Inspect component files for specific functionality

## PROJECT STRUCTURE

```
src/
├── components/
│   ├── dashboard/
│   │   ├── SalesView.tsx         # Sales/billing
│   │   ├── PaymentsView.tsx      # Payment management
│   │   ├── CustomersView.tsx     # Customer CRUD
│   │   ├── ProductsView.tsx      # Product CRUD
│   │   ├── SuppliersView.tsx     # Supplier CRUD
│   │   ├── PrintBillView.tsx     # Bill printing
│   │   └── ReportsView.tsx       # Reports
│   ├── ui/                        # Reusable UI components
│   └── AppSidebar.tsx            # Navigation
├── pages/
│   ├── Dashboard.tsx             # Admin dashboard
│   ├── CustomerPortal.tsx        # Customer login portal
│   ├── Auth.tsx                  # Admin authentication
│   └── UpdatedIndex.tsx          # Landing page
├── integrations/
│   └── supabase/                 # Database integration
└── App.tsx                       # Main routing

supabase/
└── migrations/                   # Database migrations
```

## FEATURES TO ADD (Future Enhancements)

1. Email notifications
2. Bulk operations (import/export)
3. Advanced reporting with charts
4. Inventory alerts
5. Multi-currency support
6. Barcode scanning
7. Invoice templates
8. Credit note generation
9. Supplier payments tracking
10. Purchase orders

## LICENSE & CREDITS

This project was built with:
- React 18
- TypeScript
- Tailwind CSS
- Supabase
- Shadcn/ui
- Lovable.dev

Built for modern inventory management with scalability in mind.

==============================================
END OF SETUP GUIDE
==============================================
