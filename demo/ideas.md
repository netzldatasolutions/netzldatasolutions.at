I think this is exactly the right move.

Small wineries do not buy abstract services.
They buy what they can *see*.

A demo dashboard makes everything concrete.

Let’s design this strategically.

---

# 🎯 Goal of the Demo

Not to show technical sophistication.
But to make them think:

> “Oh wow, that’s actually useful.”

It should answer:

* Where is our money coming from?
* Who are our best customers?
* Where are we losing people?
* What should we sell more of?

---

# 🧩 Structure of the Demo Dashboard

Keep it clean. 6–7 tabs are enough.

---

## 1️⃣ Overview (Executive Summary)

This is the most important page.

Content:

* Total revenue
* Total customers
* Average order value
* Top 10 customers
* Revenue by year (bar chart)
* Revenue by product category (pie or bar)

Purpose:
Even a 60-year-old winemaker must understand this page instantly.

---

## 2️⃣ Customer Segmentation

Visuals:

* Customers by frequency (1 order, 2–5, 6+)
* Revenue by segment
* Top 20% vs rest (Pareto chart)

Insights:

* “Top 18% of customers generate 62% of revenue.”
* “One-time buyers make up 48%.”

That hits.

---

## 3️⃣ Win-Back Analysis

Visual:

* Customers inactive > 12 months
* Revenue lost from inactive customers
* List of top inactive customers

Bonus:
Button or export:

* “Win-back mailing list”

This is directly actionable.

---

## 4️⃣ Geo Analysis

Map view:

* Austria heatmap
* Vienna district breakdown
* Germany cluster if relevant

Additional:

* Revenue by region
* Average order size by region

This opens strategic discussions:

* Should we focus on Vienna?
* Should Rubin Carnuntum target Munich?

---

## 5️⃣ Product-Level Insights

Charts:

* Revenue by wine
* Repeat purchase rate per wine
* Average basket composition

Example insight:

* Rubin Carnuntum has high repeat rate.
* A specific Weißwein is bought mostly once.

This helps production and marketing.

---

## 6️⃣ Customer Lifetime Value

Simple calculation:

$CLV = \bar{order_value} \cdot frequency \cdot active_years$

Display:

* CLV distribution
* A/B/C customer classification
* Revenue contribution by CLV tier

This helps decide:
Who gets personal invites.
Who gets handwritten Christmas cards.

---

## 7️⃣ Cross-Selling Analysis

Simple market basket analysis.

Example:

* 64% of customers who buy Rubin Carnuntum also buy Zweigelt Reserve.
* Magnum buyers often also buy gift packages.

Even a basic “frequently bought together” table is powerful.

---

## 8️⃣ Fair & Event ROI (Optional Demo Section)

If dataset allows:

* Event cost
* Leads collected
* Revenue generated within 12 months
* ROI %

This could be gold for bigger wineries.

---

# 🔧 Technical Recommendation

For demo purposes:

Option A:

* Power BI
* Very visual
* Easy filtering
* Impressive

Option B:

* Streamlit app (your style)
* Web-based
* Can host demo online
* Looks modern

Option C:

* Excel dashboard
* Simple
* Most relatable

For wineries, I would honestly start with:
Power BI or even a very clean Excel dashboard.

They trust Excel.

---

# 📦 How You Present It

Important:
Do NOT say:

“Here is a dashboard.”

Say:

“Das sind 7 konkrete Fragen, die wir mit euren Daten beantworten können.”

Then show each tab as answer.

---

# 🧠 Smart Move: Use Synthetic Data

You do NOT need real winery data first.

Create:

* 1,500 fake customers
* 4 years sales
* 12 wines
* 3 fairs

Make it realistic for Carnuntum.

Call it:

“Demo-Datensatz Rubin Carnuntum”

Then show what is possible.

---

# 💰 How This Becomes a Product

You can package this as:

### Package 1 – Basic Insight Report

One-time analysis + PDF

### Package 2 – Interactive Dashboard

Quarterly update

### Package 3 – Regional Strategy Dashboard

For association level

---

# ⚠️ One Strategic Advice

Do not overload it.

The strongest effect comes from:

* 3 clear insights
* That directly relate to money

If they see money, they listen.

---

If you want, next we can:

* Design the exact KPI layout per tab
* Or define the synthetic data structure (CSV schema)
* Or decide which tech stack fits your positioning best

Where should we go deeper?



Notizen:
Region:
- AT = 50%
- DE = 25%
- BENELUX = 5%
- USA = 5%
- Rest der Welt = 5%

Channels:
- ab Hof = 10%
- Gastro = 35-40%
- LEH = Einzelhandel = 30%
- Webshop = 10%
- Events = 10%

Products:
- Zweigelt 40%
- GV 20%
- CH, WB 15% 
- BF 5%
- GM 5%
- 


Step 3: First tab to build

Start with Overview, because it validates everything:

Data loading

Filtering

KPIs

Basic charts

Table

Then add:

Segmentation

Win-back

Geo

Products

CLV

Cross-sell

Event ROI