# Ice Cream Store Simulator — Game Specification

## Overview

A single-player store management game where the player builds and runs an ice cream shop from a humble roadside stand into a thriving multi-location business. The game blends resource management, customer satisfaction, and strategic planning with a lighthearted, summer aesthetic.

---

## Core Gameplay Loop

1. **Prepare** — Stock ingredients, set the daily menu, and assign staff before opening.
2. **Serve** — Manage the rush of customers in real time (or turn-based), fulfilling orders and keeping wait times low.
3. **Earn** — Collect revenue; track profit vs. expenses.
4. **Upgrade** — Spend earnings on new equipment, ingredients, recipes, and store expansions.
5. **Repeat** — Each in-game day brings new challenges, seasonal events, and growth opportunities.

---

## Game Modes

| Mode | Description |
|---|---|
| **Story** | Campaign across 5 seasons; unlock new cities and face escalating competitors. |
| **Sandbox** | Unlimited funds, no failure state; experiment freely. |
| **Challenge** | Daily community challenges with leaderboard scoring. |

---

## Store Management

### Menu & Recipes

- **Base flavors**: vanilla, chocolate, strawberry (unlocked at start); 20+ additional flavors unlockable through research or events.
- **Toppings**: sprinkles, hot fudge, whipped cream, cherries, nuts, candy pieces, fruit, etc.
- **Serving styles**: single/double/triple scoop cones, cups, sundaes, milkshakes, floats, ice cream sandwiches.
- **Specialty items**: seasonal limited-time offerings (pumpkin spice, peppermint, etc.).
- **Recipes**: combine flavors and toppings into signature creations with unique names; well-rated recipes attract repeat customers.

### Ingredients & Inventory

- Purchase ingredients from suppliers; prices fluctuate based on season and demand.
- Perishable goods expire after a set number of in-game days — over-ordering wastes money.
- **Supply chain events**: supplier shortages, price spikes, and bulk-buy discount opportunities.
- Maintain a minimum stock level or risk running out mid-rush.

### Equipment

| Equipment | Function | Upgrades |
|---|---|---|
| Ice Cream Maker | Produces base flavors | Speed, capacity, quality tiers |
| Soft-Serve Machine | Soft-serve and swirl options | Additional flavor channels |
| Freezer | Stores pre-made batches | Size, temperature stability |
| Blender | Milkshakes and smoothies | Speed, multi-batch |
| Toppings Bar | Self-serve or staff-served toppings | Expansion slots |
| Point-of-Sale (POS) | Handles payment | Queue speed, loyalty tracking |

Equipment breaks down over time and requires maintenance or repair.

---

## Staff

- Hire, train, and schedule employees with distinct skill stats:
  - **Speed**: how fast they serve customers.
  - **Accuracy**: order error rate.
  - **Friendliness**: impact on customer satisfaction and tip income.
  - **Specialty**: some staff have bonuses for specific tasks (scooping, blending, cashiering).
- Staff have morale affected by wages, working conditions, and schedule fairness.
- Low morale leads to slower service and higher turnover.
- Training programs improve skills over time.

---

## Customers

- Customers arrive with **patience meters** that deplete while waiting; if patience runs out they leave.
- Each customer has **preferences** (flavor likes/dislikes, dietary restrictions: vegan, nut-free, etc.).
- **Customer types**:
  - Regular — predictable orders, builds loyalty.
  - Tourist — large orders, one-time visits, tips well.
  - Child — small orders, very impatient.
  - Food critic — rare; their review goes public and affects reputation.
  - VIP — high expectations; unlocks special perks if satisfied.
- **Loyalty system**: repeat customers earn loyalty points redeemable for discounts; track your top customers.

---

## Finances

- **Revenue**: sales income, tips, catering contracts.
- **Expenses**: ingredients, staff wages, rent/utilities, equipment maintenance, marketing.
- **Pricing**: set menu prices manually or use the suggested price tool; price too high → fewer customers; too low → lower margins.
- **Loans**: borrow capital for big expansions; interest accrues if not paid back promptly.
- **End-of-day report**: revenue, expenses, profit/loss, customer satisfaction score, waste log.

---

## Reputation & Marketing

- **Star rating** (1–5) aggregated from customer satisfaction, health inspections, and critic reviews.
- **Word of mouth**: happy customers bring friends; unhappy customers post bad reviews.
- **Marketing campaigns**: spend money on local ads, social media promotions, and loyalty card programs to attract new customers.
- **Community events**: sponsor local festivals or set up a pop-up booth for bonus exposure.
- **Health inspections**: random inspections; cleanliness and food safety compliance affect rating and can result in temporary closure if failed.

---

## Progression & Unlocks

### Seasons (Story Mode)

| Season | Setting | New Challenge |
|---|---|---|
| 1 | Hometown stand | Basic management, limited menu |
| 2 | Small beach town | Higher volume, seasonal surge |
| 3 | City food court | Multi-station management, competition |
| 4 | Tourist resort | VIP clientele, premium menu requirements |
| 5 | Franchise launch | Multi-location oversight, brand consistency |

### Research Tree

Spend Research Points (earned from milestones) to unlock:
- New flavors and ingredients
- Equipment upgrades
- Staff training programs
- Marketing tools
- Store aesthetic customization options

### Store Customization

- Interior decor themes: Classic Parlor, Tropical, Modern Minimalist, Retro Diner, etc.
- Exterior signage and color schemes.
- Seating arrangements affect capacity and ambiance score.
- Ambiance score influences customer patience and willingness to pay premium prices.

---

## Events & Challenges

- **Summer Rush**: peak demand days with double customer volume.
- **Heat Wave**: ingredient spoilage rate doubles; ice cream melts faster on cones.
- **Local Fair**: pop-up booth mini-game for bonus revenue.
- **Power Outage**: equipment offline; serve only pre-made stock.
- **Competitor Opens Nearby**: customer traffic temporarily diverted; counter with promotions.
- **New Trend Alert**: a flavor or style goes viral; stock it fast to capitalize.
- **Charity Drive**: donate a portion of profits for a reputation boost.

---

## Win / Loss Conditions (Story Mode)

- **Win**: meet the season's revenue and reputation targets before the final in-game day.
- **Soft Fail**: miss targets but stay solvent — replay the season or accept a reduced score.
- **Hard Fail**: go bankrupt (debt exceeds ability to pay); game over for that run.

---

## UI / UX Summary

- **Top bar**: current date, weather, daily revenue tracker, reputation stars.
- **Main view**: store floor showing customers, staff, and equipment in action.
- **Side panels**: quick-access inventory, staff status, and active orders queue.
- **Pause menu**: access full management screens (finances, menu editor, staff scheduler, research tree, store customization).
- **Accessibility**: adjustable game speed (1×, 2×, pause), colorblind-friendly palette options, text size scaling.

---

## Technical Assumptions

- 2D art style; top-down or isometric perspective.
- Target platforms: PC (primary), with mobile adaptation considered.
- Save system: auto-save at end of each in-game day; manual save slots available.
- Session length: one in-game day ≈ 5–15 minutes of real time (configurable).
