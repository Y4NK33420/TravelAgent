import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MapPin, Clock, Utensils, Heart, Plus, ChefHat, Wine } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  image: string;
  suggested: number;
  price: string;
  rating: number;
  cuisine: string[];
  location: string;
  type: 'fine-dining' | 'casual' | 'cafe' | 'street-food' | 'bistro';
  specialty: string;
}

interface DiningSectionProps {
  planningData: any;
  onSelectionChange: (data: any) => void;
  isTransitioning: boolean;
}

const mockRestaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Indian Accent',
    description: 'Contemporary Indian tasting menu with innovative presentations',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
    suggested: 98,
    price: '₹5000-8000',
    rating: 4.9,
    cuisine: ['Indian', 'Fine Dining'],
    location: 'The Lodhi, New Delhi',
    type: 'fine-dining',
    specialty: 'Modern Indian Cuisine'
  },
  {
    id: '2',
    name: 'Karim\'s',
    description: 'Iconic Mughlai cuisine near Jama Masjid since 1913',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
    suggested: 89,
    price: '₹400-800',
    rating: 4.5,
    cuisine: ['Mughlai', 'North Indian'],
    location: 'Old Delhi',
    type: 'street-food',
    specialty: 'Mutton Korma & Kebabs'
  },
  {
    id: '3',
    name: 'Leopold Cafe',
    description: 'Historic Mumbai institution with colonial charm',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
    suggested: 92,
    price: '₹600-1200',
    rating: 4.3,
    cuisine: ['Continental', 'Indian'],
    location: 'Colaba, Mumbai',
    type: 'cafe',
    specialty: 'All-Day Dining'
  },
  {
    id: '4',
    name: 'Saravana Bhavan',
    description: 'Authentic South Indian vegetarian meals',
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&h=600&fit=crop',
    suggested: 85,
    price: '₹300-600',
    rating: 4.6,
    cuisine: ['South Indian', 'Vegetarian'],
    location: 'Multiple Locations',
    type: 'casual',
    specialty: 'Dosa & Idli'
  },
  {
    id: '5',
    name: 'Bukhara',
    description: 'World-renowned North Indian tandoor dishes',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
    suggested: 87,
    price: '₹4000-6000',
    rating: 4.4,
    cuisine: ['North Indian', 'Tandoor'],
    location: 'ITC Maurya, New Delhi',
    type: 'bistro',
    specialty: 'Dal Bukhara & Kebabs'
  },
  {
    id: '6',
    name: 'Paranthe Wali Gali',
    description: 'Historic lane famous for stuffed parathas',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&h=600&fit=crop',
    suggested: 83,
    price: '₹100-300',
    rating: 4.2,
    cuisine: ['Street Food', 'North Indian'],
    location: 'Chandni Chowk, Old Delhi',
    type: 'casual',
    specialty: 'Stuffed Parathas'
  }
];

export function DiningSection({ planningData, onSelectionChange, isTransitioning }: DiningSectionProps) {
  const getTopSuggestionCount = (tripStyle: string) => {
    switch (tripStyle) {
      case 'laid-back': return 2;
      case 'adventurous': return 4;
      default: return 3;
    }
  };

  const topSuggestionCount = getTopSuggestionCount(planningData.tripStyle);
  const sortedRestaurants = [...mockRestaurants].sort((a, b) => b.suggested - a.suggested);
  
  // Pre-select top AI suggestions by default
  const defaultSelections = sortedRestaurants.slice(0, topSuggestionCount).map(r => r.id);
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>(defaultSelections);
  const [hoveredRestaurant, setHoveredRestaurant] = useState<string | null>(null);

  // Initialize with default selections
  useEffect(() => {
    const newDefaultSelections = sortedRestaurants.slice(0, topSuggestionCount).map(r => r.id);
    setSelectedRestaurants(newDefaultSelections);
    onSelectionChange(newDefaultSelections);
  }, [planningData?.tripStyle]);

  const handleToggleRestaurant = (restaurantId: string) => {
    const newSelection = selectedRestaurants.includes(restaurantId)
      ? selectedRestaurants.filter(id => id !== restaurantId)
      : [...selectedRestaurants, restaurantId];
    
    setSelectedRestaurants(newSelection);
    onSelectionChange(newSelection);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'fine-dining': 'bg-amber-500/20 text-amber-300',
      'casual': 'bg-blue-500/20 text-blue-300',
      'cafe': 'bg-green-500/20 text-green-300',
      'street-food': 'bg-orange-500/20 text-orange-300',
      'bistro': 'bg-purple-500/20 text-purple-300'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500/20 text-gray-300';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center mb-12"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block p-4 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm mb-6"
        >
          <ChefHat className="w-8 h-8 text-orange-400" />
        </motion.div>
        
        <h2 className="text-3xl text-white mb-4">Savor Amazing Flavors</h2>
        <p className="text-white/70 text-lg max-w-2xl mx-auto">
          Discover incredible dining experiences from Michelin-starred restaurants to hidden local gems.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedRestaurants.map((restaurant, index) => {
          const isSelected = selectedRestaurants.includes(restaurant.id);
          const isTopSuggestion = index < topSuggestionCount;
          const isHovered = hoveredRestaurant === restaurant.id;

          return (
            <motion.div
              key={restaurant.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
              onHoverStart={() => setHoveredRestaurant(restaurant.id)}
              onHoverEnd={() => setHoveredRestaurant(null)}
            >
              <Card className={`overflow-hidden cursor-pointer transition-all duration-300 ${
                isSelected 
                  ? 'ring-2 ring-orange-400 bg-orange-500/10' 
                  : 'bg-black/20 hover:bg-black/30'
              } backdrop-blur-sm border-white/10`}>
                <div className="relative">
                  <div className="aspect-video overflow-hidden">
                    <motion.img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                      animate={{ scale: isHovered ? 1.05 : 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

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

                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-3 right-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                          <Heart className="w-4 h-4 text-white fill-current" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="absolute bottom-3 right-3">
                    <Badge className={getTypeColor(restaurant.type)}>
                      {restaurant.type.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-white text-lg leading-tight">{restaurant.name}</h3>
                    <div className="flex items-center text-yellow-400 ml-2">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm ml-1">{restaurant.rating}</span>
                    </div>
                  </div>

                  <p className="text-white/70 text-sm mb-4 line-clamp-2">
                    {restaurant.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-white/60 text-sm">
                      <MapPin className="w-4 h-4 mr-2" />
                      {restaurant.location}
                    </div>
                    <div className="flex items-center text-white/60 text-sm">
                      <Utensils className="w-4 h-4 mr-2" />
                      {restaurant.specialty}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {restaurant.cuisine.map((cuisine) => (
                      <Badge key={cuisine} variant="secondary" className="text-xs bg-white/10 text-white/70">
                        {cuisine}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-orange-400">{restaurant.price}</span>
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => handleToggleRestaurant(restaurant.id)}
                      className={isSelected 
                        ? "bg-orange-600 hover:bg-orange-700 text-white" 
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

      <AnimatePresence>
        {selectedRestaurants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center space-x-2 bg-orange-500/20 rounded-full px-6 py-3 backdrop-blur-sm">
              <Heart className="w-5 h-5 text-orange-400" />
              <span className="text-white">
                {selectedRestaurants.length} restaurant{selectedRestaurants.length !== 1 ? 's' : ''} selected
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}