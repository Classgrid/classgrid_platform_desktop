# Classgrid ERP - Onboarding Flow & Architecture Notes

This document maps out exactly how an Organization progresses through the 8 mandatory onboarding steps, and which department/role is responsible for configuring each step during their 31-day Sandbox trial or Active usage.

## 1. Initial Setup (onboard.classgrid.in)
These steps are completed immediately by the primary decision-maker before they even reach the main ERP dashboard.
- ✅ **Step 1: Tenant Created** (Account created, verified, password set)
- ✅ **Step 2: Branding Configured** (Logo, domain, and colors set)

## 2. Core Academic Setup (By Org Admin)
Once logged into the main dashboard, the Organization Admin takes over to build the foundation.
- ✅ **Step 3: Academic Hierarchy Set** (The Admin configures the structural foundation: Standards, Divisions, Semesters, or Courses depending on the institution type).

## 3. Data Migration (By Org Admin)
The Admin begins moving their physical data into Classgrid.
- ✅ **Step 4: Staff Imported** (Admin invites other administrators and bulk-imports faculty/teachers via CSV).
- ✅ **Step 5: Students Imported** (Students are imported in bulk via CSV and mapped to the Academic Hierarchy created in Step 3).

> [!TIP]
> **CRITICAL INSIGHT:** The CSV Data Migration (Steps 4 & 5) is **ONLY for the very first time** the school sets up Classgrid to migrate their historical data. For the next academic year and beyond, they will NOT use CSV imports. Instead, the **Admission Module** and Admin workflows will organically handle all new student and staff intake!

## 4. Departmental Configuration (By Module Admins)
Once the foundation and data exist, the specific module admins configure their respective modules using the imported Students, Faculty, and Academic Hierarchy.
- ✅ **Step 6: Fee Structure Configured** (The Admin or Fee Manager logs into the Fee module to set up installments, ledgers, and payment gateways).
  - *Ongoing Insight:* Initial setup is just for defining the structure (Tuition, Bus fee). For all future years, the system **automatically** generates invoices and collects payments organically; no manual ledger creation needed!
- ✅ **Step 7: Admission Form Configured** (The Admission Department logs into the Admission module to open the portal, set form logic, and define the seat matrix).

*(The following modules are configured alongside or after the core steps, heavily utilizing the imported student database)*:
* **Library Configuration**: The Library Manager catalogs books. When a student borrows a book, it links directly to their imported student profile.
* **Attendance Configuration**: Faculty and Admins set up attendance policies. Teachers use the imported student lists to mark daily attendance.
* **Hostel Configuration**: The Hostel Warden configures rooms and allocates beds directly to the imported students.
* **Canteen Configuration**: The Canteen Manager handles inventory. Students use their ID cards (linked to their profile) for meals.
* **Exam Configuration**: The Exam Controller sets up grading scales (Term 1, Term 2). Teachers organically enter marks for the imported students, and the system generates automated report cards.
* *(Future)* **HR Configuration**: The HR Admin will manage payroll and leave requests for the imported staff/faculty.

## 5. User Activation
- ✅ **Step 8: First Login Completed** (This is automatically tracked by the system the very first time the Admin successfully hits the main dashboard).

---

### Isolated End-User Portals
* **Student Dashboard**: The dedicated, restricted portal for students to view their attendance, pay fees, check exam results, and access classroom notes.
* **Faculty Dashboard**: The dedicated portal for teachers to manage their assigned classrooms, upload study materials, mark attendance, and enter exam scores.

---

## 6. Payment Gateway Architecture
Classgrid utilizes a dual payment gateway strategy to completely separate B2B SaaS revenue from B2C school fee collections.

### Easebuzz (B2C: Student ➡️ College)
* **Used By**: Admission Department, Fee Manager, and Students.
* **Setup Location**: Configured in entirely separate billing settings inside the **Admission Dashboard** and **Fee Dashboard**.
* **Purpose**: Easebuzz is integrated via their Partner Program. It strictly handles the heavy flow of tuition fees and admission fees directly from the Student/Parent to the College's bank account.

### Razorpay (B2B: College ➡️ Classgrid)
* **Used By**: Organization Admin (Super Admin billing).
* **Setup Location**: Configured in a separate, isolated billing setup page inside the **Organization Admin Dashboard**.
* **Purpose**: Razorpay is strictly used to collect the Classgrid ERP subscription fees (e.g., upgrading from a 31-day Sandbox to Active Production). This ensures Classgrid's SaaS revenue is completely isolated from the massive volume of student fee transactions.
