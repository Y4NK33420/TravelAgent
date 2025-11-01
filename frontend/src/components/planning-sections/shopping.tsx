import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MapPin, Clock, ShoppingBag, Heart, Plus, Euro, Gift } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface ShoppingDestination {
  id: string;
  name: string;
  description: string;
  image: string;
  suggested: number; // 1-100
  priceRange: string;
  rating: number;
  location: string;
  type: 'luxury' | 'markets' | 'boutiques' | 'department' | 'vintage' | 'souvenirs';
  specialties: string[];
  hours: string;
  atmosphere: string;
}

interface ShoppingSectionProps {
  planningData: any;
  onSelectionChange: (data: any) => void;
  isTransitioning: boolean;
}

// Mock data - in real app this would come from API
const mockShoppingDestinations: ShoppingDestination[] = [
  {
    id: '1',
    name: 'Khan Market',
    description: 'Upscale shopping district with designer boutiques and cafes',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
    suggested: 95,
    priceRange: '₹₹₹₹',
    rating: 4.6,
    location: 'New Delhi',
    type: 'luxury',
    specialties: ['Designer Fashion', 'Books', 'Home Decor', 'Jewelry'],
    hours: '10:00 - 20:00',
    atmosphere: 'Upscale and trendy'
  },
  {
    id: '2',
    name: 'Chor Bazaar',
    description: 'Famous flea market with antiques, vintage items, and collectibles',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
    suggested: 89,
    priceRange: '₹₹',
    rating: 4.4,
    location: 'Mumbai',
    type: 'vintage',
    specialties: ['Antiques', 'Vintage Items', 'Collectibles', 'Furniture'],
    hours: 'Mon-Sat: 11:00 - 19:00',
    atmosphere: 'Eclectic and treasure-hunting'
  },
  {
    id: '3',
    name: 'Johari Bazaar',
    description: 'Traditional jewelry market famous for precious gems and ornaments',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
    suggested: 92,
    priceRange: '₹₹₹',
    rating: 4.7,
    location: 'Jaipur, Rajasthan',
    type: 'boutiques',
    specialties: ['Jewelry', 'Gemstones', 'Traditional Ornaments', 'Kundan Work'],
    hours: '10:00 - 20:00',
    atmosphere: 'Traditional and vibrant'
  },
  {
    id: '4',
    name: 'Select Citywalk',
    description: 'Modern shopping mall with international and Indian brands',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
    suggested: 87,
    priceRange: '₹₹₹₹',
    rating: 4.5,
    location: 'Saket, New Delhi',
    type: 'department',
    specialties: ['Fashion', 'Electronics', 'Dining', 'Entertainment'],
    hours: '10:00 - 22:00',
    atmosphere: 'Modern and spacious'
  },
  {
    id: '5',
    name: 'Dilli Haat',
    description: 'Open-air market with handicrafts and regional specialties',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
    suggested: 78,
    priceRange: '₹',
    rating: 4.0,
    location: 'INA, New Delhi',
    type: 'souvenirs',
    specialties: ['Handicrafts', 'Textiles', 'Regional Food', 'Souvenirs'],
    hours: '10:30 - 22:00',
    atmosphere: 'Cultural and authentic'
  },
  {
    id: '6',
    name: 'Colaba Causeway',
    description: 'Bustling street market with fashion, accessories, and souvenirs',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
    suggested: 85,
    priceRange: '₹₹',
    rating: 4.6,
    location: 'Colaba, Mumbai',
    type: 'markets',
    specialties: ['Street Fashion', 'Accessories', 'Art', 'Souvenirs'],
    hours: '10:00 - 21:00',
    atmosphere: 'Bustling and eclectic'
  },
  {
    id: '7',
    name: 'Marché Saint-Germain',
    description: 'Covered market with specialty foods and local products',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
    suggested: 82,
    priceRange: '€€',
    rating: 4.3,
    location: '6th arrondissement',
    type: 'markets',
    specialties: ['Gourmet Food', 'Local Products', 'Cheese', 'Wine'],
    hours: 'Tue-Sat: 8:00 - 20:00',
    atmosphere: 'Authentic and local'
  },
  {
    id: '8',
    name: 'L\'Avenue Montaigne',
    description: 'Exclusive shopping street with the world\'s most prestigious brands',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
    suggested: 79,
    priceRange: '€€€€€',
    rating: 4.8,
    location: '8th arrondissement',
    type: 'luxury',
    specialties: ['Haute Couture', 'Luxury Watches', 'Fine Jewelry', 'Designer Shoes'],
    hours: '10:00 - 19:00',
    atmosphere: 'Ultra-exclusive and refined'
  }
];

export function ShoppingSection({ planningData, onSelectionChange, isTransitioning }: ShoppingSectionProps) {
  const getTopSuggestionCount = (tripStyle: string) => {
    switch (tripStyle) {
      case 'laid-back': return 2;
      case 'adventurous': return 3;
      default: return 3; // balanced
    }
  };

  const topSuggestionCount = getTopSuggestionCount(planningData.tripStyle);
  const sortedShopping = [...mockShoppingDestinations].sort((a, b) => b.suggested - a.suggested);
  
  // Pre-select top AI suggestions by default
  const defaultSelections = sortedShopping.slice(0, topSuggestionCount).map(s => s.id);
  const [selectedShopping, setSelectedShopping] = useState<string[]>(defaultSelections);
  const [hoveredShopping, setHoveredShopping] = useState<string | null>(null);

  // Initialize with default selections
  useEffect(() => {
    const newDefaultSelections = sortedShopping.slice(0, topSuggestionCount).map(s => s.id);
    setSelectedShopping(newDefaultSelections);
    onSelectionChange(newDefaultSelections);
  }, [planningData?.tripStyle]);

  const handleToggleShopping = (shoppingId: string) => {
    const newSelection = selectedShopping.includes(shoppingId)
      ? selectedShopping.filter(id => id !== shoppingId)
      : [...selectedShopping, shoppingId];
    
    setSelectedShopping(newSelection);
    onSelectionChange(newSelection);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      luxury: 'bg-purple-500/20 text-purple-300',
      markets: 'bg-green-500/20 text-green-300',
      boutiques: 'bg-pink-500/20 text-pink-300',
      department: 'bg-blue-500/20 text-blue-300',
      vintage: 'bg-amber-500/20 text-amber-300',
      souvenirs: 'bg-orange-500/20 text-orange-300'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500/20 text-gray-300';
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Section intro */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center mb-12"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block p-4 rounded-full bg-gradient-to-r from-pink-500/20 to-rose-500/20 backdrop-blur-sm mb-6"
        >
          <ShoppingBag className="w-8 h-8 text-pink-400" />
        </motion.div>
        
        <h2 className="text-3xl text-white mb-4">
          Shop & Explore Markets
        </h2>
        <p className="text-white/70 text-lg max-w-2xl mx-auto">
          Discover unique shopping experiences from luxury boutiques to charming local markets.
          Find perfect souvenirs and treat yourself to Parisian style.
        </p>
      </motion.div>

      {/* Shopping destinations grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedShopping.map((shopping, index) => {
          const isSelected = selectedShopping.includes(shopping.id);
          const isTopSuggestion = index < topSuggestionCount;
          const isHovered = hoveredShopping === shopping.id;

          return (
            <motion.div
              key={shopping.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
              onHoverStart={() => setHoveredShopping(shopping.id)}
              onHoverEnd={() => setHoveredShopping(null)}
              className="group"
            >
              <Card className={`overflow-hidden cursor-pointer transition-all duration-300 ${
                isSelected 
                  ? 'ring-2 ring-pink-400 bg-pink-500/10' 
                  : 'bg-black/20 hover:bg-black/30'
              } backdrop-blur-sm border-white/10`}>
                <div className="relative">
                  {/* Image */}
                  <div className="aspect-video overflow-hidden">
                    <motion.img
                      src={shopping.image}
                      alt={shopping.name}
                      className="w-full h-full object-cover"
                      animate={{
                        scale: isHovered ? 1.05 : 1
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Suggested badge */}
                  {isTopSuggestion && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="absolute top-3 left-3"
                    >
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                        <Star className="w-3 h-3 mr-1" />
                        AI Suggested
                      </Badge>
                    </motion.div>
                  )}

                  {/* Selection indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-3 right-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center">
                          <Heart className="w-4 h-4 text-white fill-current" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Type badge */}
                  <div className="absolute bottom-3 right-3">
                    <Badge className={getTypeColor(shopping.type)}>
                      {shopping.type}
                    </Badge>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-white text-lg leading-tight">{shopping.name}</h3>
                    <div className="flex items-center text-yellow-400 ml-2">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm ml-1">{shopping.rating}</span>
                    </div>
                  </div>

                  <p className="text-white/70 text-sm mb-4 line-clamp-2">
                    {shopping.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-white/60 text-sm">
                      <MapPin className="w-4 h-4 mr-2" />
                      {shopping.location}
                    </div>
                    <div className="flex items-center text-white/60 text-sm">
                      <Clock className="w-4 h-4 mr-2" />
                      {shopping.hours}
                    </div>
                    <div className="flex items-center text-white/60 text-sm">
                      <Gift className="w-4 h-4 mr-2" />
                      {shopping.atmosphere}
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {shopping.specialties.slice(0, 3).map((specialty) => (
                      <Badge key={specialty} variant="secondary" className="text-xs bg-white/10 text-white/70">
                        {specialty}
                      </Badge>
                    ))}
                    {shopping.specialties.length > 3 && (
                      <Badge variant="secondary" className="text-xs bg-white/10 text-white/70">
                        +{shopping.specialties.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-pink-400">{shopping.priceRange}</span>
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => handleToggleShopping(shopping.id)}
                      className={isSelected 
                        ? "bg-pink-600 hover:bg-pink-700 text-white" 
                        : "border-white/20 text-white hover:bg-white/10"
                      }
                    >
                      {isSelected ? (
                        <>
                          <Heart className="w-4 h-4 mr-1 fill-current" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Selection summary */}
      <AnimatePresence>
        {selectedShopping.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center space-x-2 bg-pink-500/20 rounded-full px-6 py-3 backdrop-blur-sm">
              <Heart className="w-5 h-5 text-pink-400" />
              <span className="text-white">
                {selectedShopping.length} shopping destination{selectedShopping.length !== 1 ? 's' : ''} selected
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}