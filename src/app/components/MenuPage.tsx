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
    addToCart(name, price, category);
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

// Food item with variant and add-on options support
interface Variant {
  id: string;
  name: string;
  price: number;
}

interface AddOn {
  id: string;
  name: string;
  price: number;
}

interface FoodItemCardProps {
  name: string;
  basePrice?: number;
  description?: string;
  category?: string;
  variants?: Variant[];
  addOns?: AddOn[];
  requiresVariant?: boolean; // If true, must select a variant
}

function FoodItemCard({ name, basePrice, description, category, variants, addOns, requiresVariant }: FoodItemCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [isAdded, setIsAdded] = useState(false);
  const { addToCart } = useCart();

  const calculateTotal = () => {
    let total = basePrice || 0;

    // Add variant price
    if (selectedVariant && variants) {
      const variant = variants.find(v => v.id === selectedVariant);
      total = variant?.price || 0;
    }

    // Add add-ons
    const addOnsTotal = selectedAddOns.reduce((sum, addOnId) => {
      const addOn = addOns?.find(a => a.id === addOnId);
      return sum + (addOn?.price || 0);
    }, 0);

    return total + addOnsTotal;
  };

  const handleAddToCart = () => {
    // If requires variant but none selected, don't proceed
    if (requiresVariant && !selectedVariant && variants && variants.length > 0) {
      return;
    }

    let itemName = name;
    let itemParts: string[] = [];

    // Add variant to name
    if (selectedVariant && variants) {
      const variant = variants.find(v => v.id === selectedVariant);
      if (variant) {
        itemParts.push(variant.name);
      }
    }

    // Add add-ons to name
    if (selectedAddOns.length > 0 && addOns) {
      const addOnNames = selectedAddOns.map(id => {
        const addOn = addOns.find(a => a.id === id);
        return addOn?.name;
      }).filter(Boolean);
      if (addOnNames.length > 0) {
        itemParts.push(`+ ${addOnNames.join(', ')}`);
      }
    }

    if (itemParts.length > 0) {
      itemName = `${name} (${itemParts.join(' | ')})`;
    }

    const total = calculateTotal();
    addToCart(itemName, `£${total.toFixed(2)}`, category);
    setIsAdded(true);
    setShowOptions(false);
    setSelectedVariant(null);
    setSelectedAddOns([]);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns(prev =>
      prev.includes(addOnId)
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  // If no variants or add-ons, use simple card
  if (!variants && !addOns) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
        {category && (
          <span className="inline-block px-3 py-1 bg-[#B88A68]/10 text-[#B88A68] text-xs font-semibold rounded-full mb-3">
            {category}
          </span>
        )}
        <div className="mb-3">
          <h4 className="font-semibold text-lg text-gray-900 mb-1">{name}</h4>
          {basePrice && <p className="text-2xl font-bold text-[#B88A68]">£{basePrice.toFixed(2)}</p>}
        </div>
        {description && (
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{description}</p>
        )}
        <button
          onClick={() => addToCart(name, `£${basePrice?.toFixed(2)}`, category)}
          className="w-full py-2.5 px-4 rounded-full font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-[#B88A68] text-white hover:bg-[#A67958]"
        >
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
        {category && (
          <span className="inline-block px-3 py-1 bg-[#B88A68]/10 text-[#B88A68] text-xs font-semibold rounded-full mb-3">
            {category}
          </span>
        )}
        <div className="mb-3">
          <h4 className="font-semibold text-lg text-gray-900 mb-1">{name}</h4>
          {basePrice !== undefined && <p className="text-2xl font-bold text-[#B88A68]">£{basePrice.toFixed(2)}</p>}
          {variants && variants.length > 0 && !basePrice && (
            <p className="text-sm text-gray-600">From £{Math.min(...variants.map(v => v.price)).toFixed(2)}</p>
          )}
        </div>
        {description && (
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{description}</p>
        )}
        <button
          onClick={() => setShowOptions(true)}
          className={`w-full py-2.5 px-4 rounded-full font-semibold text-sm transition-all flex items-center justify-center gap-2 ${isAdded
            ? 'bg-green-500 text-white'
            : 'bg-[#B88A68] text-white hover:bg-[#A67958]'
            }`}
        >
          <ShoppingCart className="w-4 h-4" />
          {isAdded ? 'Added!' : 'Add to Cart'}
        </button>
      </div>

      {/* Options Modal */}
      {showOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
              <p className="text-sm text-gray-600 mb-6">Customize your order</p>

              {/* Variants Selection */}
              {variants && variants.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {requiresVariant ? 'Choose Option *' : 'Choose Option (Optional)'}
                  </h4>
                  <div className="space-y-2">
                    {variants.map((variant) => (
                      <label
                        key={variant.id}
                        className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-[#B88A68] cursor-pointer transition-colors"
                      >
                        <input
                          type="radio"
                          name="variant"
                          checked={selectedVariant === variant.id}
                          onChange={() => setSelectedVariant(variant.id)}
                          className="w-5 h-5 text-[#B88A68] border-gray-300 focus:ring-[#B88A68]"
                        />
                        <div className="flex-1 flex justify-between items-center">
                          <span className="font-semibold text-gray-900">{variant.name}</span>
                          <span className="text-[#B88A68] font-bold">£{variant.price.toFixed(2)}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons Selection */}
              {addOns && addOns.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Add-ons (Optional)</h4>
                  <div className="space-y-2">
                    {addOns.map((addOn) => (
                      <label
                        key={addOn.id}
                        className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-[#B88A68] cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAddOns.includes(addOn.id)}
                          onChange={() => toggleAddOn(addOn.id)}
                          className="w-5 h-5 text-[#B88A68] border-gray-300 rounded focus:ring-[#B88A68]"
                        />
                        <div className="flex-1 flex justify-between items-center">
                          <span className="font-semibold text-gray-900">{addOn.name}</span>
                          <span className="text-[#B88A68] font-bold">+£{addOn.price.toFixed(2)}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total</span>
                  <span className="text-2xl font-bold text-[#B88A68]">£{calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowOptions(false);
                    setSelectedVariant(null);
                    setSelectedAddOns([]);
                  }}
                  className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-full hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={requiresVariant && !selectedVariant}
                  className="flex-1 py-3 px-4 bg-[#B88A68] text-white font-semibold rounded-full hover:bg-[#A67958] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Drink item with extras support
interface DrinkItemCardProps {
  name: string;
  price: string;
  description?: string;
  category?: string;
}

interface DrinkOption {
  id: string;
  name: string;
  price: number;
  description?: string;
  subOptions?: DrinkOption[];
}

const SYRUP_OPTIONS: DrinkOption[] = [
  { id: 'pumpkin-spice', name: 'Pumpkin Spice', price: 0.7 },
  { id: 'milk-on-side', name: 'Milk on Side', price: 0 },
  { id: 'vanilla', name: 'Vanilla', price: 0.7 },
  { id: 'caramel', name: 'Caramel', price: 0.7 },
  { id: 'smores', name: "S'mores", price: 0.7 },
  { id: 'cookie-dough', name: 'Cookie Dough', price: 0.7 },
  { id: 'amaretto', name: 'Amaretto', price: 0.7 },
  { id: 'caramel-pancake', name: 'Caramel Pancake', price: 0.7 },
  { id: 'gingerbread', name: 'Gingerbread', price: 0.7 },
  { id: 'cinnamon-bun', name: 'Cinnamon Bun', price: 0.7 },
  { id: 'honeycomb', name: 'Honeycomb', price: 0.7 },
  { id: 'butter-pecan', name: 'Butter Pecan', price: 0.7 },
  { id: 'coconut-syrup', name: 'Coconut', price: 0.7 },
  { id: 'toasted-marshmallow', name: 'Toasted Marshmallow', price: 0.7 },
  { id: 'hazelnut', name: 'Hazelnut', price: 0.7 },
  { id: 'choc-caramel-turtle', name: 'Choc Caramel Turtle', price: 0.7 },
  { id: 'pistachio', name: 'Pistachio', price: 0.7 },
  { id: 'speculoos-biscuit', name: 'Speculoos Biscuit', price: 0.7 },
  { id: 'blueberry-lavender', name: 'Blueberry Lavender', price: 0.7 },
];

const DECAF_OPTIONS: DrinkOption[] = [
  { id: 'skinny', name: 'SKINNY R', price: 0 },
  { id: 'decaf', name: 'DECAF', price: 0 },
];

const ADDON_OPTIONS: DrinkOption[] = [
  { id: 'protein', name: 'Protein', price: 3 },
  { id: 'extra-shot', name: 'Extra Shot', price: 0.7 },
  {
    id: 'alt-milk',
    name: 'Alternative Milk',
    price: 0.7,
    subOptions: [
      { id: 'soya', name: 'Soya', price: 0 },
      { id: 'oat', name: 'Oat', price: 0 },
      { id: 'coconut', name: 'Coconut', price: 0 },
      { id: 'almond', name: 'Almond', price: 0 },
    ]
  },
  { id: 'marshmallow-cream', name: 'Marshmallow & Cream', price: 0.7 },
  { id: 'size-up', name: 'Size Up', price: 0.7 },
  { id: 'size-up-x2', name: 'Size Up x2', price: 1.4 },
  { id: 'extra-shot-x2', name: 'Extra shot x2', price: 1.4 },
];

function DrinkItemCard({ name, price, description, category }: DrinkItemCardProps) {
  const [showExtras, setShowExtras] = useState(false);
  const [selectedSyrups, setSelectedSyrups] = useState<string[]>([]);
  const [selectedDecaf, setSelectedDecaf] = useState<string[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [selectedAltMilk, setSelectedAltMilk] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const { addToCart } = useCart();

  const parsePrice = (priceStr: string): number => {
    const match = priceStr.match(/£([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const calculateTotal = () => {
    const basePrice = parsePrice(price);

    // Add syrup prices
    const syrupsTotal = selectedSyrups.reduce((sum, syrupId) => {
      const syrup = SYRUP_OPTIONS.find(s => s.id === syrupId);
      return sum + (syrup?.price || 0);
    }, 0);

    // Decaf options are free

    // Add add-on prices
    const addOnsTotal = selectedAddOns.reduce((sum, addOnId) => {
      const addOn = ADDON_OPTIONS.find(a => a.id === addOnId);
      // If alternative milk is selected, add its price
      if (addOn?.id === 'alt-milk') {
        return sum + (addOn?.price || 0);
      }
      return sum + (addOn?.price || 0);
    }, 0);

    return basePrice + syrupsTotal + addOnsTotal;
  };

  const handleAddToCart = () => {
    let itemName = name;
    let itemParts: string[] = [];

    // Add syrups to name
    if (selectedSyrups.length > 0) {
      const syrupNames = selectedSyrups.map(id => {
        const syrup = SYRUP_OPTIONS.find(s => s.id === id);
        return syrup?.name;
      }).filter(Boolean);
      if (syrupNames.length > 0) {
        itemParts.push(`Syrups: ${syrupNames.join(', ')}`);
      }
    }

    // Add decaf to name
    if (selectedDecaf.length > 0) {
      const decafNames = selectedDecaf.map(id => {
        const decaf = DECAF_OPTIONS.find(d => d.id === id);
        return decaf?.name;
      }).filter(Boolean);
      if (decafNames.length > 0) {
        itemParts.push(decafNames.join(', '));
      }
    }

    // Add add-ons to name
    if (selectedAddOns.length > 0) {
      const addOnNames = selectedAddOns.map(id => {
        const addOn = ADDON_OPTIONS.find(a => a.id === id);
        if (addOn?.id === 'alt-milk' && selectedAltMilk) {
          const milkOption = addOn.subOptions?.find(s => s.id === selectedAltMilk);
          return `${addOn.name} (${milkOption?.name})`;
        }
        return addOn?.name;
      }).filter(Boolean);
      if (addOnNames.length > 0) {
        itemParts.push(addOnNames.join(', '));
      }
    }

    if (itemParts.length > 0) {
      itemName = `${name} (${itemParts.join(' | ')})`;
    }

    const total = calculateTotal();
    addToCart(itemName, `£${total.toFixed(2)}`, category);
    setIsAdded(true);
    setShowExtras(false);
    setSelectedSyrups([]);
    setSelectedDecaf([]);
    setSelectedAddOns([]);
    setSelectedAltMilk(null);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const toggleSyrup = (syrupId: string) => {
    setSelectedSyrups(prev => {
      if (prev.includes(syrupId)) {
        return prev.filter(id => id !== syrupId);
      } else if (prev.length < 10) {
        return [...prev, syrupId];
      }
      return prev;
    });
  };

  const toggleDecaf = (decafId: string) => {
    setSelectedDecaf(prev => {
      if (prev.includes(decafId)) {
        return prev.filter(id => id !== decafId);
      } else if (prev.length < 2) {
        return [...prev, decafId];
      }
      return prev;
    });
  };

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns(prev => {
      if (prev.includes(addOnId)) {
        // If removing alt-milk, also clear selected milk type
        if (addOnId === 'alt-milk') {
          setSelectedAltMilk(null);
        }
        return prev.filter(id => id !== addOnId);
      } else if (prev.length < 10) {
        return [...prev, addOnId];
      }
      return prev;
    });
  };

  return (
    <>
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
          onClick={() => setShowExtras(true)}
          className={`w-full py-2.5 px-4 rounded-full font-semibold text-sm transition-all flex items-center justify-center gap-2 ${isAdded
            ? 'bg-green-500 text-white'
            : 'bg-[#B88A68] text-white hover:bg-[#A67958]'
            }`}
        >
          <ShoppingCart className="w-4 h-4" />
          {isAdded ? 'Added!' : 'Add to Cart'}
        </button>
      </div>

      {/* Customization Modal */}
      {showExtras && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
              <p className="text-sm text-gray-600 mb-6">Customize your drink</p>

              {/* Syrups Section */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  SYRUPS (MAX 10 CHOICES): {selectedSyrups.length}/10 selected
                </h4>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {SYRUP_OPTIONS.map((syrup) => (
                    <label
                      key={syrup.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-colors ${selectedSyrups.includes(syrup.id)
                        ? 'border-[#B88A68] bg-[#B88A68]/10'
                        : 'border-gray-200 hover:border-[#B88A68]'
                        } ${selectedSyrups.length >= 10 && !selectedSyrups.includes(syrup.id) ? 'opacity-50' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSyrups.includes(syrup.id)}
                        onChange={() => toggleSyrup(syrup.id)}
                        disabled={selectedSyrups.length >= 10 && !selectedSyrups.includes(syrup.id)}
                        className="w-4 h-4 text-[#B88A68] border-gray-300 rounded focus:ring-[#B88A68]"
                      />
                      <div className="flex-1 flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-900">{syrup.name}</span>
                        <span className="text-[#B88A68] font-semibold">£{syrup.price.toFixed(2)}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Decaf Section */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  DECAF (MAX 2 CHOICES): {selectedDecaf.length}/2 selected
                </h4>
                <div className="flex gap-3">
                  {DECAF_OPTIONS.map((decaf) => (
                    <label
                      key={decaf.id}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors flex-1 ${selectedDecaf.includes(decaf.id)
                        ? 'border-[#B88A68] bg-[#B88A68]/10'
                        : 'border-gray-200 hover:border-[#B88A68]'
                        } ${selectedDecaf.length >= 2 && !selectedDecaf.includes(decaf.id) ? 'opacity-50' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDecaf.includes(decaf.id)}
                        onChange={() => toggleDecaf(decaf.id)}
                        disabled={selectedDecaf.length >= 2 && !selectedDecaf.includes(decaf.id)}
                        className="w-4 h-4 text-[#B88A68] border-gray-300 rounded focus:ring-[#B88A68]"
                      />
                      <span className="font-semibold text-gray-900">{decaf.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Add-ons Section */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  ADD ONS (MAX 10 CHOICES): {selectedAddOns.length}/10 selected
                </h4>
                <div className="space-y-2">
                  {ADDON_OPTIONS.map((addOn) => (
                    <div key={addOn.id}>
                      <label
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${selectedAddOns.includes(addOn.id)
                          ? 'border-[#B88A68] bg-[#B88A68]/10'
                          : 'border-gray-200 hover:border-[#B88A68]'
                          } ${selectedAddOns.length >= 10 && !selectedAddOns.includes(addOn.id) ? 'opacity-50' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAddOns.includes(addOn.id)}
                          onChange={() => toggleAddOn(addOn.id)}
                          disabled={selectedAddOns.length >= 10 && !selectedAddOns.includes(addOn.id)}
                          className="w-4 h-4 text-[#B88A68] border-gray-300 rounded focus:ring-[#B88A68]"
                        />
                        <div className="flex-1 flex justify-between items-center">
                          <span className="font-semibold text-gray-900">{addOn.name}</span>
                          <span className="text-[#B88A68] font-bold">+£{addOn.price.toFixed(2)}</span>
                        </div>
                      </label>

                      {/* Alternative Milk Sub-options */}
                      {addOn.id === 'alt-milk' && selectedAddOns.includes('alt-milk') && addOn.subOptions && (
                        <div className="ml-8 mt-2 grid grid-cols-2 gap-2">
                          {addOn.subOptions.map((milk) => (
                            <label
                              key={milk.id}
                              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${selectedAltMilk === milk.id
                                ? 'border-[#B88A68] bg-[#B88A68]/5'
                                : 'border-gray-200 hover:border-[#B88A68]'
                                }`}
                            >
                              <input
                                type="radio"
                                name="alt-milk"
                                checked={selectedAltMilk === milk.id}
                                onChange={() => setSelectedAltMilk(milk.id)}
                                className="w-4 h-4 text-[#B88A68] border-gray-300 focus:ring-[#B88A68]"
                              />
                              <span className="text-sm font-medium text-gray-700">{milk.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total</span>
                  <span className="text-2xl font-bold text-[#B88A68]">£{calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowExtras(false);
                    setSelectedSyrups([]);
                    setSelectedDecaf([]);
                    setSelectedAddOns([]);
                    setSelectedAltMilk(null);
                  }}
                  className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-full hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3 px-4 bg-[#B88A68] text-white font-semibold rounded-full hover:bg-[#A67958] transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
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
              <DrinkItemCard name="Espresso" price="£2.8 / £3.3" category="Coffee" />
              <DrinkItemCard name="Americano" price="£3.3 / £4" category="Coffee" />
              <DrinkItemCard name="Macchiato" price="£3.5 / £4.2" category="Coffee" />
              <DrinkItemCard name="Cortado" price="£3.5 / £4.2" category="Coffee" />
              <DrinkItemCard name="Cappuccino" price="£3.5 / £4.2" category="Coffee" />
              <DrinkItemCard name="Flat White" price="£3.5 / £4.2" category="Coffee" />
              <DrinkItemCard name="Latte" price="£3.6 / £4.2" category="Coffee" />
              <DrinkItemCard name="Mocha" price="£3.8 / £4.5" category="Coffee" />
            </div>

            {/* Tea & Non-Coffee */}
            <h3 className="text-2xl font-bold text-[#B88A68] mb-6">Tea & Non-Coffee</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <DrinkItemCard name="Breakfast Tea" price="£3.2" category="Tea" />
              <DrinkItemCard name="Chai Tea" price="£3.8" category="Tea" />
              <DrinkItemCard name="Matcha Latte" price="£4.6" category="Tea" />
              <DrinkItemCard name="Hot Chocolate" price="£3.6" category="Hot Drink" />
              <DrinkItemCard name="Herbal Tea" price="£3.5" category="Tea" />
            </div>

            {/* Iced Drinks */}
            <h3 className="text-2xl font-bold text-[#B88A68] mb-6">Iced Drinks</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <DrinkItemCard name="Iced Matcha" price="£5.5" category="Iced" />
              <DrinkItemCard name="Iced Latte" price="£4.5" category="Iced" />
              <DrinkItemCard name="Iced Chai" price="£5.5" category="Iced" />
            </div>

            {/* iSmothies */}
            <h3 className="text-2xl font-bold text-[#B88A68] mb-6">iSmothies</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <DrinkItemCard name="Berry & Coconut" price="£6" category="Smoothie" />
              <DrinkItemCard name="Mango & Coconut" price="£6" category="Smoothie" />
              <DrinkItemCard name="Strawberry & Banana" price="£6" category="Smoothie" />
              <DrinkItemCard name="Mango, Spinach & Apple" price="£6" category="Smoothie" />
              <DrinkItemCard name="Iced Banana & Date" price="£6" category="Smoothie" />
            </div>

            {/* Milkshakes */}
            <h3 className="text-2xl font-bold text-[#B88A68] mb-6">Milkshakes</h3>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <DrinkItemCard name="Vanilla" price="£6" category="Milkshake" />
              <DrinkItemCard name="Strawberry" price="£6" category="Milkshake" />
              <DrinkItemCard name="Chocolate" price="£6" category="Milkshake" />
            </div>

            {/* Soft Drinks */}
            <h3 className="text-2xl font-bold text-[#B88A68] mb-6">Soft Drinks</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <MenuItemCard name="Orange or Apple Juice" price="£3" category="Soft Drink" />
              <MenuItemCard name="VITHIT" price="£3.5" category="Soft Drink" />
              <MenuItemCard name="Trip" price="£3" category="Soft Drink" />
              <FoodItemCard
                name="Canned Drinks"
                category="Soft Drink"
                requiresVariant={true}
                variants={[
                  { id: 'coca-cola', name: 'Coca-Cola', price: 2.5 },
                  { id: 'diet-coke', name: 'Diet Coke', price: 2.5 },
                  { id: 'coke-zero', name: 'Coke Zero', price: 2.5 },
                  { id: 'fanta', name: 'Fanta', price: 2.5 },
                  { id: 'sprite', name: 'Sprite', price: 2.5 },
                ]}
              />
              <MenuItemCard name="Monster" price="£3" category="Soft Drink" />
              <MenuItemCard name="Still/Sparkling Water" price="£2" category="Soft Drink" />
              <MenuItemCard name="Capri Sun" price="£2" category="Soft Drink" />
              <MenuItemCard name="Lipton Tea" price="£3" category="Soft Drink" />
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
              <FoodItemCard
                name="Burrito Bowl"
                basePrice={8.85}
                description="Basmati rice, sweetcorn, red onion, tomato, black beans, avocado, chilli oil"
                category="Main"
                addOns={[
                  { id: 'poached-eggs', name: 'Poached eggs', price: 2.50 },
                  { id: 'falafel', name: 'Falafel', price: 2.50 },
                  { id: 'crispy-pork', name: 'Crispy pork belly', price: 2.50 },
                  { id: 'grilled-chicken', name: 'Grilled Chicken', price: 2.50 },
                  { id: 'korean-chicken', name: 'Korean Chicken', price: 2.50 },
                  { id: 'hot-chicken', name: 'Hot Chicken', price: 2.50 },
                  { id: 'bbq-chicken', name: 'BBQ Chicken', price: 2.50 },
                  { id: 'halloumi', name: 'Grilled Halloumi', price: 3.00 },
                ]}
              />
              <FoodItemCard
                name="Shawarma"
                description="Lebanese flatbread, pickles, red cabbage slaw, yogurt sauce, lettuce and house seasoning fries"
                category="Main"
                requiresVariant={true}
                variants={[
                  { id: 'chicken', name: 'Chicken', price: 10.85 },
                  { id: 'lamb', name: 'Lamb', price: 12.50 },
                  { id: 'beef', name: 'Beef', price: 12.50 },
                  { id: 'veggie', name: 'Veggie', price: 9.85 },
                ]}
              />
              <FoodItemCard
                name="Rigatoni"
                category="Main"
                requiresVariant={true}
                variants={[
                  { id: 'chicken-chorizo', name: 'Chicken & Chorizo', price: 11.95 },
                  { id: 'beef-ragu', name: 'Slow Cooked Beef Ragu', price: 12.50 },
                ]}
              />
              <FoodItemCard
                name="Gnocchi"
                category="Main"
                requiresVariant={true}
                variants={[
                  { id: 'italian-sausage', name: 'Italian Sausage', price: 12.50 },
                  { id: 'mushroom-truffle', name: 'Wild Mushroom & Truffle', price: 10.95 },
                ]}
              />
              <FoodItemCard
                name="Burgers"
                description="All served with Cajun fries"
                category="Main"
                requiresVariant={true}
                variants={[
                  { id: 'beef', name: 'Double Patty Smashed Beef', price: 12.50 },
                  { id: 'chicken', name: 'Honey & Chilli Fried Chicken', price: 12.75 },
                  { id: 'veggie', name: 'Beetroot & Bean', price: 11.50 },
                ]}
                addOns={[
                  { id: 'bacon', name: 'Bacon', price: 1.00 },
                  { id: 'black-pudding', name: 'Black pudding', price: 1.00 },
                  { id: 'fried-egg', name: 'Fried egg', price: 1.00 },
                  { id: 'cheddar', name: 'Cheddar', price: 1.00 },
                  { id: 'mozzarella', name: 'Mozzarella', price: 1.00 },
                  { id: 'avocado', name: 'Avocado', price: 1.00 },
                  { id: 'feta', name: 'Feta', price: 3.00 },
                  { id: 'halloumi', name: 'Halloumi', price: 3.00 },
                  { id: 'jalapenos', name: 'Jalapeños', price: 0.50 },
                  { id: 'crispy-onion', name: 'Crispy onion', price: 0.50 },
                ]}
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
                <FoodItemCard
                  name="Mini Breakfast"
                  basePrice={4.50}
                  description="Fruit + Scrambled eggs on toast"
                  category="Breakfast"
                  addOns={[
                    { id: 'nutella', name: 'Nutella', price: 0 },
                    { id: 'jam', name: 'Jam', price: 0 },
                  ]}
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
              <FoodItemCard
                name="Scrambled Egg"
                category="Main"
                requiresVariant={true}
                description="Protein-rich scrambled eggs for your pup"
                variants={[
                  { id: 'one-egg', name: '1 Egg', price: 1.00 },
                  { id: 'two-eggs', name: '2 Eggs', price: 2.00 },
                ]}
              />
              <FoodItemCard
                name="Cooked Pork Sausage"
                category="Main"
                requiresVariant={true}
                description="Dog-safe pork sausage"
                variants={[
                  { id: 'one-sausage', name: '1 Sausage', price: 1.00 },
                  { id: 'two-sausages', name: '2 Sausages', price: 2.00 },
                ]}
              />
              <FoodItemCard
                name="Grilled Chicken"
                category="Main"
                requiresVariant={true}
                description="Grilled chicken, rice and peas"
                variants={[
                  { id: 'small', name: 'Small', price: 3.50 },
                  { id: 'large', name: 'Large', price: 5.50 },
                ]}
              />
              <MenuItemCard
                name="Arnia Dogs Food"
                price="£5.00"
                description="Premium dog food (Large portion)"
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