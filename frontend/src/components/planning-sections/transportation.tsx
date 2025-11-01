import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MapPin, Clock, Car, Train, Plane, Heart, Plus } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface TransportOption {
  id: string;
  name: string;
  description: string;
  image: string;
  suggested: number;
  price: string;
  duration: string;
  type: 'flight' | 'train' | 'car' | 'bus' | 'metro';
  route: string;
  features: string[];
}

interface TransportationSectionProps {
  planningData: any;
  onSelectionChange: (data: any) => void;
  isTransitioning: boolean;
}

const mockTransportOptions: TransportOption[] = [
  {
    id: '1',
    name: 'Air India Direct Flight',
    description: 'Direct flight with excellent service and comfortable seating',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=600&fit=crop',
    suggested: 95,
    price: '₹15000-35000',
    duration: '2-3 hours',
    type: 'flight',
    route: 'Delhi → Mumbai',
    features: ['Direct Flight', 'Meals Included', 'Entertainment']
  },
  {
    id: '2',
    name: 'Shatabdi Express Train',
    description: 'Premium high-speed train with comfortable seating',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop',
    suggested: 88,
    price: '₹1500-3000',
    duration: '5-6 hours',
    type: 'train',
    route: 'Delhi → Agra',
    features: ['AC Coaches', 'Meals Included', 'Comfortable Seats']
  },
  {
    id: '3',
    name: 'Delhi Metro Pass',
    description: 'Unlimited access to Delhi Metro network',
    image: 'https://images.unsplash.com/photo-1592490337798-3811b23ed628?w=800&h=600&fit=crop',
    suggested: 92,
    price: '₹200-600',
    duration: 'Varies',
    type: 'metro',
    route: 'All Delhi NCR',
    features: ['Unlimited Travel', 'AC Coaches', '1-7 Day Options']
  }
];

export function TransportationSection({ planningData, onSelectionChange, isTransitioning }: TransportationSectionProps) {
  // Pre-select top AI suggestions by default
  const defaultSelections = mockTransportOptions.slice(0, 2).map(t => t.id); // Select top 2 transport options
  const [selectedTransport, setSelectedTransport] = useState<string[]>(defaultSelections);

  // Initialize with default selections
  useEffect(() => {
    onSelectionChange(defaultSelections);
  }, []);

  const handleToggleTransport = (transportId: string) => {
    const newSelection = selectedTransport.includes(transportId)
      ? selectedTransport.filter(id => id !== transportId)
      : [...selectedTransport, transportId];
    
    setSelectedTransport(newSelection);
    onSelectionChange(newSelection);
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      flight: Plane,
      train: Train,
      car: Car,
      bus: Car,
      metro: Train
    };
    return icons[type as keyof typeof icons] || Car;
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
          className="inline-block p-4 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm mb-6"
        >
          <Car className="w-8 h-8 text-blue-400" />
        </motion.div>
        
        <h2 className="text-3xl text-white mb-4">Get Around in Style</h2>
        <p className="text-white/70 text-lg max-w-2xl mx-auto">
          Choose your preferred transportation methods for a seamless travel experience.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockTransportOptions.map((transport, index) => {
          const isSelected = selectedTransport.includes(transport.id);
          const IconComponent = getTypeIcon(transport.type);

          return (
            <motion.div
              key={transport.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
            >
              <Card className={`overflow-hidden cursor-pointer transition-all duration-300 ${
                isSelected 
                  ? 'ring-2 ring-blue-400 bg-blue-500/10' 
                  : 'bg-black/20 hover:bg-black/30'
              } backdrop-blur-sm border-white/10`}>
                <div className="relative">
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={transport.image}
                      alt={transport.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="absolute top-3 left-3">
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                      <Star className="w-3 h-3 mr-1" />
                      AI Suggested
                    </Badge>
                  </div>

                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-3 right-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                          <Heart className="w-4 h-4 text-white fill-current" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="absolute bottom-3 right-3">
                    <div className="flex items-center bg-black/50 rounded-full px-2 py-1">
                      <IconComponent className="w-4 h-4 text-white mr-1" />
                      <span className="text-white text-sm capitalize">{transport.type}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-white text-lg mb-3">{transport.name}</h3>
                  <p className="text-white/70 text-sm mb-4">{transport.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-white/60 text-sm">
                      <MapPin className="w-4 h-4 mr-2" />
                      {transport.route}
                    </div>
                    <div className="flex items-center text-white/60 text-sm">
                      <Clock className="w-4 h-4 mr-2" />
                      {transport.duration}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {transport.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs bg-white/10 text-white/70">
                        {feature}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-blue-400">{transport.price}</span>
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => handleToggleTransport(transport.id)}
                      className={isSelected 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
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
    </div>
  );
}