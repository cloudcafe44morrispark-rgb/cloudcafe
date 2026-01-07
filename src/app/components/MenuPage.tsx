import { ShoppingCart, PawPrint, Coffee, Utensils, Egg, Baby } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

interface MenuItemCardProps {
  name: string;
  price: string;
  description?: string;
  category?: string;
}

function MenuItemCard({ name, price, description, category }: MenuItemCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(name, price);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
      {category && (
        <span className="inline-block px-3 py-1 bg-[#B88A68]/10 text-[#B88A68] text-xs font-semibold rounded-full mb-3">
          {category}
        </span>
      )}
      <div className="mb-3">
        <h4 className="font-semibold text-lg text-gray-900 mb-1">{name}</h4>
        <p className="text-2xl font-bold text-[#B88A68]">{price}</p>
      </div>
      {description && (
        <p className="text-sm text-gray-600 leading-relaxed mb-4">{description}</p>
      )}
      <button
        onClick={handleAddToCart}
        className={`w-full py-2.5 px-4 rounded-full font-semibold text-sm transition-all flex items-center justify-center gap-2 ${isAdded
            ? 'bg-green-500 text-white'
            : 'bg-[#B88A68] text-white hover:bg-[#A67958]'
          }`}
      >
        <ShoppingCart className="w-4 h-4" />
        {isAdded ? 'Added!' : 'Add to Cart'}
      </button>
    </div>
  );
}

export function MenuPage() {
  const [activeSection, setActiveSection] = useState('drinks');

  const menuCategories = [
    { id: 'drinks', label: 'Drinks', icon: Coffee },
    { id: 'lunch', label: 'Lunch', icon: Utensils },
    { id: 'breakfast-brunch', label: 'Breakfast & Brunch', icon: Egg },
    { id: 'kids', label: 'Kids Menu', icon: Baby },
    { id: 'doggo', label: 'Doggo Menu', icon: PawPrint },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navHeight = 80; // Height of the sticky nav
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navHeight - 20;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(sectionId);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = menuCategories.map(cat => cat.id);
      const scrollPosition = window.scrollY + 150;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Header */}
      <div className="relative bg-[#B88A68] text-white py-20">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Our Menu</h1>
          <p className="text-xl text-white/90">Discover delicious offerings at Cloud Cafe</p>
        </div>
      </div>

      {/* Sticky Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex overflow-x-auto scrollbar-hide">
            {menuCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => scrollToSection(category.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm whitespace-nowrap border-b-2 transition-all ${activeSection === category.id
                      ? 'border-[#B88A68] text-[#B88A68]'
                      : 'border-transparent text-gray-600 hover:text-[#B88A68]'
                    }`}
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  {category.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Drinks Menu Section */}
        <section id="drinks" className="mb-20 scroll-mt-24">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Coffee className="w-10 h-10 text-[#B88A68]" />
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">Drinks</h2>
            </div>
            <div className="w-24 h-1 bg-[#B88A68] mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Premium coffee, refreshing teas, and specialty drinks
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Coffee Classics */}
            <h3 className="text-2xl font-bold text-[#B88A68] mb-6">Coffee Classics</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <MenuItemCard name="Espresso" price="£2.8 / £3.3" category="Coffee" />
              <MenuItemCard name="Americano" price="£3.3 / £4" category="Coffee" />
              <MenuItemCard name="Macchiato" price="£3.5 / £4.2" category="Coffee" />
              <MenuItemCard name="Cortado" price="£3.5 / £4.2" category="Coffee" />
              <MenuItemCard name="Cappuccino" price="£3.5 / £4.2" category="Coffee" />
              <MenuItemCard name="Flat White" price="£3.5 / £4.2" category="Coffee" />
              <MenuItemCard name="Latte" price="£3.5 / £4.2" category="Coffee" />
              <MenuItemCard name="Mocha" price="£3.8 / £4.5" category="Coffee" />
            </div>

            {/* Tea & Non-Coffee */}
            <h3 className="text-2xl font-bold text-[#B88A68] mb-6">Tea & Non-Coffee</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <MenuItemCard name="Breakfast Tea" price="£3.2" category="Tea" />
              <MenuItemCard name="Chai Tea" price="£3.8" category="Tea" />
              <MenuItemCard name="Matcha Latte" price="£4.6" category="Tea" />
              <MenuItemCard name="Hot Chocolate" price="£3.6" category="Hot Drink" />
              <MenuItemCard name="Herbal Tea" price="£3.5" category="Tea" />
            </div>

            {/* Iced Drinks */}
            <h3 className="text-2xl font-bold text-[#B88A68] mb-6">Iced Drinks</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <MenuItemCard name="Iced Matcha" price="£5.5" category="Iced" />
              <MenuItemCard name="Iced Banana & Date" price="£6.5" category="Iced" />
              <MenuItemCard name="Mango or Strawberry" price="£6.5" category="Iced" />
              <MenuItemCard name="Iced Latte" price="£4.5" category="Iced" />
              <MenuItemCard name="Iced Banana & Date" price="£6" category="Iced" />
              <MenuItemCard name="Iced Chai" price="£5.5" category="Iced" />
            </div>

            {/* iSmothies */}
            <h3 className="text-2xl font-bold text-[#B88A68] mb-6">iSmothies</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <MenuItemCard name="Berry & Coconut" price="£6" category="Smoothie" />
              <MenuItemCard name="Mango & Coconut" price="£6" category="Smoothie" />
              <MenuItemCard name="Strawberry & Banana" price="£6" category="Smoothie" />
              <MenuItemCard name="Mango, Spinach & Apple" price="£6" category="Smoothie" />
            </div>

            {/* Milkshakes */}
            <h3 className="text-2xl font-bold text-[#B88A68] mb-6">Milkshakes</h3>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <MenuItemCard name="Vanilla" price="£6" category="Milkshake" />
              <MenuItemCard name="Strawberry" price="£6" category="Milkshake" />
              <MenuItemCard name="Chocolate" price="£6" category="Milkshake" />
            </div>

            {/* Soft Drinks */}
            <h3 className="text-2xl font-bold text-[#B88A68] mb-6">Soft Drinks</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <MenuItemCard name="Orange or Apple Juice" price="£3" category="Soft Drink" />
              <MenuItemCard name="VITHIT" price="£3.5" category="Soft Drink" />
              <MenuItemCard name="Trip" price="£3" category="Soft Drink" />
              <MenuItemCard name="Canned Drinks" price="£2.5" description="Coca-Cola, Diet Coke, Coke Zero, Fanta, Sprite" category="Soft Drink" />
              <MenuItemCard name="Monster" price="£3" category="Soft Drink" />
              <MenuItemCard name="Still/Sparkling Water" price="£2" category="Soft Drink" />
              <MenuItemCard name="Capri Sun" price="£2" category="Soft Drink" />
              <MenuItemCard name="Corona Zero" price="£4.4" category="Soft Drink" />
              <MenuItemCard name="Lipton Tea" price="£3" category="Soft Drink" />
            </div>

            {/* Extras */}
            <h3 className="text-2xl font-bold text-[#B88A68] mb-6">Extras</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MenuItemCard name="Shot of Coffee" price="£0.7" category="Extra" />
              <MenuItemCard name="Alternative Milk" price="£0.7" description="Oat, coconut, soya, almond" category="Extra" />
              <MenuItemCard name="Protein Powder" price="£3" category="Extra" />
              <MenuItemCard name="Cream & Marshmallows" price="£0.7" category="Extra" />
              <MenuItemCard name="Coffee Syrup" price="£0.7" description="Check with us for flavours!" category="Extra" />
            </div>
          </div>
        </section>

        {/* Lunch Menu Section */}
        <section id="lunch" className="mb-20 scroll-mt-24">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Utensils className="w-10 h-10 text-[#B88A68]" />
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">Lunch</h2>
            </div>
            <div className="w-24 h-1 bg-[#B88A68] mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Served from 12 PM - Delicious lunch options for every appetite
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* I'm Picky Section */}
            <h3 className="text-3xl font-bold text-[#B88A68] mb-8 text-center">I'M PICKY</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              <MenuItemCard
                name="Soup"
                price="£4.85"
                description="With tiger leaf"
                category="Light"
              />
              <MenuItemCard
                name="Chicken Tenders"
                price="£8.15"
                description="With hot sauce"
                category="Light"
              />
              <MenuItemCard
                name="Chicken Gyoza"
                price="£6.50"
                description="With soy sauce, garlic & chilli"
                category="Light"
              />
              <MenuItemCard
                name="Lamb Koftas"
                price="£7.95"
                description="With yoghurt dip & olives"
                category="Light"
              />
              <MenuItemCard
                name="Crispy Gnocchi"
                price="£6.95"
                description="With caper cream & walnuts"
                category="Light"
              />
              <MenuItemCard
                name="House Salad"
                price="£3.50"
                category="Light"
              />
              <MenuItemCard
                name="Hummus & Flatbread"
                price="£4.50"
                category="Light"
              />
              <MenuItemCard
                name="Olives"
                price="£4.00"
                category="Light"
              />
              <MenuItemCard
                name="Sourdough Garlic Bread"
                price="£4.50"
                category="Light"
              />
              <MenuItemCard
                name="Fries"
                price="£4.75"
                category="Side"
              />
              <MenuItemCard
                name="Sweet Potato"
                price="£6.25"
                category="Side"
              />
              <MenuItemCard
                name="Halloumi"
                price="£7.70"
                category="Side"
              />
            </div>

            {/* I'm Starving Section */}
            <h3 className="text-3xl font-bold text-[#B88A68] mb-8 text-center">I'M STARVING</h3>
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <MenuItemCard
                name="Malaysian Chicken"
                price="£11.85"
                description="Grilled chicken marinated in a mix of spices and coconut milk, coriander and chilli served with rice and greens"
                category="Main"
              />
              <MenuItemCard
                name="Peruvian Pork"
                price="£11.95"
                description="Crispy pork belly bites, sweet potato fries, Peruvian salsa and spicy aji verde sauce"
                category="Main"
              />
              <MenuItemCard
                name="Falafel Bowl"
                price="£9.50"
                description="Homemade falafel, tomato, cucumber, red onion, olives, pine nuts salad and hummus"
                category="Main"
              />
              <MenuItemCard
                name="Chicken Sushi Bowl"
                price="£11.95"
                description="Japanese style fried chicken, sushi rice, Asian slaw, avocado, sriracha mayo and crispy onion"
                category="Main"
              />
              <MenuItemCard
                name="Burrito Bowl"
                price="£8.85"
                description="Basmati rice, sweetcorn, red onion, tomato, black beans, avocado, chilli oil. Add protein: Poached eggs/falafel/crispy pork belly/Chicken (Grilled, Korean, Hot, BBQ) £2.50 / Grilled Halloumi £3.00"
                category="Main"
              />
              <MenuItemCard
                name="Shawarma"
                price="Chicken £10.85 / Lamb £12.50 / Beef £12.50 / Veggie £9.85"
                description="Lebanese flatbread, pickles, red cabbage slaw, yogurt sauce, lettuce and house seasoning fries"
                category="Main"
              />
              <MenuItemCard
                name="Rigatoni"
                price="Chicken & Chorizo £11.95 / Slow Cooked Beef Ragu £12.50"
                category="Main"
              />
              <MenuItemCard
                name="Gnocchi"
                price="Italian Sausage £12.50 / Wild Mushroom & Truffle £10.95"
                category="Main"
              />
              <MenuItemCard
                name="Burgers"
                price="From £11.50 - £12.75"
                description="Double Patty Smashed Beef £12.50 | Honey & Chilli Fried Chicken £12.75 | Beetroot & Bean £11.50. All served with Cajun fries. Toppings: £1 bacon/black pudding/fried egg/cheddar/mozzarella/avocado // £3 feta/halloumi /£0.50 jalapeños/crispy onion"
                category="Main"
              />
            </div>
          </div>
        </section>

        {/* Breakfast & Brunch Section */}
        <section id="breakfast-brunch" className="mb-20 scroll-mt-24">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Egg className="w-10 h-10 text-[#B88A68]" />
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">Breakfast & Brunch</h2>
            </div>
            <div className="w-24 h-1 bg-[#B88A68] mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Start your day right with our delicious breakfast options
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MenuItemCard
              name="Full Breakfast"
              price="£9.75"
              description="Sausage, bacon, eggs, beans, mushrooms, tomato & toast"
              category="Breakfast"
            />
            <MenuItemCard
              name="Veggie Breakfast"
              price="£9.75"
              description="Vegetarian sausage, eggs, beans, mushrooms, tomato & toast"
              category="Breakfast"
            />
            <MenuItemCard
              name="Breakfast Bap"
              price="£5.75"
              description="Your choice of filling in a soft bap"
              category="Breakfast"
            />
            <MenuItemCard
              name="Morning Hot Rolls"
              price="£3.00"
              description="Freshly baked hot rolls with butter"
              category="Breakfast"
            />
            <MenuItemCard
              name="Granola"
              price="£3.25+"
              description="Homemade granola with milk or yogurt"
              category="Breakfast"
            />
            <MenuItemCard
              name="Protein Pancakes"
              price="£8.50"
              description="High-protein pancakes with toppings"
              category="Brunch"
            />
            <MenuItemCard
              name="Smashed Avocado"
              price="£7.50"
              description="On sourdough toast with poached eggs"
              category="Brunch"
            />
            <MenuItemCard
              name="Spinach & Mushroom Toast"
              price="£6.50"
              description="Sautéed spinach and mushrooms on toast"
              category="Brunch"
            />
            <MenuItemCard
              name="Scrambled Eggs"
              price="£5.50"
              description="Fluffy scrambled eggs on toast"
              category="Brunch"
            />
          </div>
        </section>

        {/* Kids Menu Section */}
        <section id="kids" className="mb-20 scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Kids Menu</h2>
            <div className="w-24 h-1 bg-[#B88A68] mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Special treats for our little guests
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="md:col-span-3">
              <h3 className="text-2xl font-bold text-[#B88A68] mb-6">BREAKFAST</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <MenuItemCard
                  name="Mini Breakfast"
                  price="£4.50"
                  description="Fruit + Nutella or Jam, Scrambled eggs on toast"
                  category="Breakfast"
                />
                <MenuItemCard
                  name="Eggs & Sausage"
                  price="£4.00"
                  description="Choice of bacon or sausage with eggs"
                  category="Breakfast"
                />
                <MenuItemCard
                  name="Root Veg Special"
                  price="£4.00"
                  description="Healthy veggie option with choice of toppings"
                  category="Breakfast"
                />
              </div>
            </div>

            <div className="md:col-span-3 mt-8">
              <h3 className="text-2xl font-bold text-[#B88A68] mb-6">LUNCH</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <MenuItemCard
                  name="Beef Finger & Chips"
                  price="£3.00"
                  description="Tender beef fingers with crispy chips"
                  category="Lunch"
                />
                <MenuItemCard
                  name="Chicken Tenders"
                  price="£3.00"
                  description="With chips or rice & peas"
                  category="Lunch"
                />
                <MenuItemCard
                  name="Cheese Toastie"
                  price="£3.00"
                  description="Classic grilled cheese sandwich"
                  category="Lunch"
                />
              </div>
            </div>

            <div className="md:col-span-3 mt-8">
              <h3 className="text-2xl font-bold text-[#B88A68] mb-6">DRINKS</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <MenuItemCard
                  name="Mini Milkshake"
                  price="£3.50"
                  description="Various flavors available"
                  category="Drink"
                />
                <MenuItemCard
                  name="Cardi Can Milk"
                  price="£3.50"
                  description="Fresh and nutritious"
                  category="Drink"
                />
                <MenuItemCard
                  name="Mini Milk"
                  price="£3.50"
                  description="Perfect size for kids"
                  category="Drink"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Doggo Menu Section */}
        <section id="doggo" className="mb-20 scroll-mt-24">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <PawPrint className="w-10 h-10 text-[#B88A68]" />
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">Doggo Menu</h2>
              <PawPrint className="w-10 h-10 text-[#B88A68]" />
            </div>
            <div className="w-24 h-1 bg-[#B88A68] mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Special treats for your furry friends! 🐾
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <h3 className="text-2xl font-bold text-[#B88A68] mb-6">MAIN</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <MenuItemCard
                name="Scrambled Egg"
                price="1 or 2"
                description="Protein-rich scrambled eggs for your pup"
                category="Main"
              />
              <MenuItemCard
                name="Cooked Pork Sausage"
                price="1 or 2"
                description="Dog-safe pork sausage"
                category="Main"
              />
              <MenuItemCard
                name="Grilled Chicken"
                price="Small/Large"
                description="Grilled chicken, rice and peas"
                category="Main"
              />
              <MenuItemCard
                name="Arnia Dogs Food"
                price="5 Large"
                description="Premium dog food (for dogs with allergies)"
                category="Main"
              />
            </div>

            <h3 className="text-2xl font-bold text-[#B88A68] mb-6">DESSERTS</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <MenuItemCard
                name="Sweet Potato & Peanut Butter Bowl"
                price="£3.00"
                description="Healthy and delicious treat"
                category="Dessert"
              />
              <MenuItemCard
                name="Doggy Chocolate"
                price="£2.50"
                description="Dog-safe chocolate alternative"
                category="Dessert"
              />
              <MenuItemCard
                name="Dogo-Doggo"
                price="£2.50"
                description="Holistic yogurt treat"
                category="Dessert"
              />
            </div>
          </div>
        </section>

        {/* Footer Note */}
        <div className="text-center mt-16 py-8 border-t border-gray-200">
          <p className="text-gray-600 italic max-w-2xl mx-auto">
            Please let us know about any allergies. We're happy to accommodate dietary requirements.
            <br />
            <span className="text-sm">All prices subject to change. Please ask staff for today's specials.</span>
          </p>
        </div>
      </div>
    </div>
  );
}