"""Seed script — populates DynamoDB with sample products."""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.infrastructure.database.product_repo import create_product

SAMPLE_PRODUCTS = [
    {
        "title": "Premium Miniket Rice",
        "description": "Finest quality Miniket rice from Dinajpur. Aged for 12 months for perfect aroma and texture. Ideal for daily cooking and special occasions.",
        "price": 72.0,
        "unit": "kg",
        "category": "Rice",
        "quantity": 500,
        "farmer_email": "demo-farmer@agrolink.bd",
        "farmer_name": "Abdul Karim",
    },
    {
        "title": "Fresh Red Spinach (Lal Shak)",
        "description": "Organically grown red spinach, harvested fresh every morning from Bogra farms. Rich in iron and vitamins. Chemical-free guaranteed.",
        "price": 30.0,
        "unit": "bundle",
        "category": "Vegetables",
        "quantity": 200,
        "farmer_email": "demo-farmer@agrolink.bd",
        "farmer_name": "Abdul Karim",
    },
    {
        "title": "Haribhanga Mango",
        "description": "World-famous Haribhanga mangoes from Rajshahi. Premium grade, naturally ripened on the tree. Sweet, juicy, and fiber-free.",
        "price": 220.0,
        "unit": "kg",
        "category": "Fruits",
        "quantity": 150,
        "farmer_email": "demo-farmer2@agrolink.bd",
        "farmer_name": "Rahim Uddin",
    },
    {
        "title": "Fresh Hilsa Fish (Ilish)",
        "description": "Padma river Hilsa, 800g-1kg size. Caught fresh and packed with ice. The king of fish in Bangladesh. Perfect for special meals.",
        "price": 1200.0,
        "unit": "piece",
        "category": "Fish",
        "quantity": 30,
        "farmer_email": "demo-farmer2@agrolink.bd",
        "farmer_name": "Rahim Uddin",
    },
    {
        "title": "Farm Fresh Eggs",
        "description": "Free-range country chicken eggs (deshi murgi). Rich yolk, high protein. From our family farm in Mymensingh.",
        "price": 14.0,
        "unit": "piece",
        "category": "Poultry",
        "quantity": 1000,
        "farmer_email": "demo-farmer3@agrolink.bd",
        "farmer_name": "Fatima Begum",
    },
    {
        "title": "Pure Cow Milk",
        "description": "Fresh, unprocessed cow milk from grass-fed cows. Delivered daily from Pabna dairy farm. No preservatives or additives.",
        "price": 90.0,
        "unit": "liter",
        "category": "Dairy",
        "quantity": 100,
        "farmer_email": "demo-farmer3@agrolink.bd",
        "farmer_name": "Fatima Begum",
    },
    {
        "title": "Organic Turmeric Powder",
        "description": "100% pure turmeric from Rangamati hill tracts. Sun-dried and stone-ground. Deep golden color with high curcumin content.",
        "price": 350.0,
        "unit": "kg",
        "category": "Spices",
        "quantity": 80,
        "farmer_email": "demo-farmer@agrolink.bd",
        "farmer_name": "Abdul Karim",
    },
    {
        "title": "Fresh Green Chili",
        "description": "Locally grown green chilies from Comilla. Medium heat, perfect for daily cooking. Freshly picked and sorted.",
        "price": 120.0,
        "unit": "kg",
        "category": "Spices",
        "quantity": 300,
        "farmer_email": "demo-farmer2@agrolink.bd",
        "farmer_name": "Rahim Uddin",
    },
    {
        "title": "Gobindobhog Aromatic Rice",
        "description": "Short-grain aromatic rice, perfect for polao, kheer, and festive dishes. Premium quality from Barisal.",
        "price": 150.0,
        "unit": "kg",
        "category": "Rice",
        "quantity": 200,
        "farmer_email": "demo-farmer3@agrolink.bd",
        "farmer_name": "Fatima Begum",
    },
    {
        "title": "Fresh Tomatoes",
        "description": "Vine-ripened tomatoes from greenhouse cultivation in Jessore. Firm, juicy, and great for salads and cooking.",
        "price": 60.0,
        "unit": "kg",
        "category": "Vegetables",
        "quantity": 400,
        "farmer_email": "demo-farmer@agrolink.bd",
        "farmer_name": "Abdul Karim",
    },
    {
        "title": "Deshi Chicken (Live)",
        "description": "Free-range country chicken, organically raised with no antibiotics. Average weight 1.2–1.5 kg. Best for deshi murgi curry.",
        "price": 550.0,
        "unit": "piece",
        "category": "Poultry",
        "quantity": 50,
        "farmer_email": "demo-farmer3@agrolink.bd",
        "farmer_name": "Fatima Begum",
    },
    {
        "title": "Fresh Banana (Sabri)",
        "description": "Sweet Sabri bananas from Narsingdi. Naturally ripened, rich in potassium. Sold in bunches of 12.",
        "price": 80.0,
        "unit": "dozen",
        "category": "Fruits",
        "quantity": 250,
        "farmer_email": "demo-farmer2@agrolink.bd",
        "farmer_name": "Rahim Uddin",
    },
]


def main():
    print("🌾 Seeding AgroLink marketplace with sample products...\n")
    for i, product in enumerate(SAMPLE_PRODUCTS, 1):
        result = create_product(**product)
        print(f"  ✅ [{i}/{len(SAMPLE_PRODUCTS)}] {result['title']} — ৳{result['price']}/{result['unit']}")
    print(f"\n🎉 Done! {len(SAMPLE_PRODUCTS)} products added to DynamoDB.")


if __name__ == "__main__":
    main()
